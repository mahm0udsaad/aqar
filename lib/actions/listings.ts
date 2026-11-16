"use server"

import { z } from "zod"
import { randomUUID } from "crypto"
import { headers } from "next/headers"
import { revalidatePath } from "next/cache"
import sharp from "sharp"
import { pool, query } from "@/lib/db/pool"
import { storage, publicUploadsPrefix, pathFromPublicUrl } from "@/lib/db/storage"
import { getCurrentUser } from "@/lib/auth/session"
import { countActiveListings, getListingLimit, needsOnboarding, type UserProfile } from "@/lib/auth/profiles"
import { MAX_PHOTOS, MIN_PHOTOS, tr } from "@/lib/listing-options"

type Failure = { success: false; message: string; code?: string }
type Result<T = {}> = ({ success: true } & T) | Failure

const UUID = /^[0-9a-f-]{36}$/i
const BUCKET = "property-images"

/** Signed-in, set-up, not suspended. Returns the user or an error result. */
async function requirePoster(lng: string): Promise<UserProfile | { error: Failure }> {
  const user = await getCurrentUser()
  if (!user) return { error: { success: false, code: "AUTH", message: tr(lng, "يجب تسجيل الدخول أولاً", "Please sign in first") } }
  if (user.is_suspended) {
    return { error: { success: false, code: "SUSPENDED", message: tr(lng, "تم إيقاف حسابك. تواصل معنا.", "Your account is suspended. Please contact us.") } }
  }
  if (needsOnboarding(user)) {
    return { error: { success: false, code: "ONBOARDING", message: tr(lng, "أكمل بيانات حسابك أولاً", "Please complete your account first") } }
  }
  return user
}

function userPhotoPrefix(userId: string) {
  return `listings/${userId}`
}

// ---------------------------------------------------------------- photos

/** Uploads one listing photo: resized to 1600px JPEG plus a 600px thumbnail. */
export async function uploadListingPhoto(formData: FormData): Promise<Result<{ url: string; thumbnailUrl: string }>> {
  const lng = formData.get("lng") === "en" ? "en" : "ar"
  const who = await requirePoster(lng)
  if ("error" in who) return who.error

  const file = formData.get("file")
  if (!(file instanceof File)) return { success: false, message: tr(lng, "لم يتم اختيار صورة", "No photo selected") }
  if (!file.type.startsWith("image/")) return { success: false, message: tr(lng, "الملف ليس صورة", "That file is not an image") }
  if (file.size > 15 * 1024 * 1024) return { success: false, message: tr(lng, "الصورة أكبر من 15 ميجا", "Photo is larger than 15MB") }

  try {
    const input = Buffer.from(await file.arrayBuffer())
    const base = sharp(input, { failOn: "error" }).rotate()
    const meta = await base.metadata()
    if (!meta.width || !meta.height || meta.width < 400 || meta.height < 300) {
      return { success: false, message: tr(lng, "الصورة صغيرة جداً (أقل من 400×300)", "Photo is too small (under 400×300)") }
    }
    const main = await base.clone().resize({ width: 1600, height: 1600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 80, mozjpeg: true }).toBuffer()
    const thumb = await base.clone().resize({ width: 600, height: 450, fit: "cover" }).jpeg({ quality: 75, mozjpeg: true }).toBuffer()

    const name = `${randomUUID()}.jpg`
    const dir = userPhotoPrefix(who.id)
    const bucket = storage.from(BUCKET)
    const up1 = await bucket.upload(`${dir}/${name}`, main, { contentType: "image/jpeg" })
    const up2 = await bucket.upload(`${dir}/thumbs/${name}`, thumb, { contentType: "image/jpeg" })
    if (up1.error || up2.error) return { success: false, message: tr(lng, "تعذّر حفظ الصورة", "Could not save the photo") }

    return {
      success: true,
      url: bucket.getPublicUrl(`${dir}/${name}`).data.publicUrl,
      thumbnailUrl: bucket.getPublicUrl(`${dir}/thumbs/${name}`).data.publicUrl,
    }
  } catch {
    return { success: false, message: tr(lng, "تعذّر قراءة الصورة، جرّب صورة أخرى", "Could not read that image, try another one") }
  }
}

// ---------------------------------------------------------------- submit / edit

const num = (min: number, max: number) => z.coerce.number().finite().min(min).max(max)

const ListingSchema = z
  .object({
    id: z.string().regex(UUID).optional(),
    lng: z.enum(["ar", "en"]).default("ar"),
    propertyType: z.enum(["sale", "rent"]),
    categoryId: z.string().regex(UUID),
    governorateId: z.string().regex(UUID),
    cityId: z.string().regex(UUID).optional().or(z.literal("")),
    areaText: z.string().trim().max(80).optional().default(""),
    address: z.string().trim().min(3).max(200),
    price: num(1, 10_000_000_000),
    size: num(1, 1_000_000),
    floor: z.coerce.number().int().min(-2).max(200).optional().nullable(),
    totalFloors: z.coerce.number().int().min(0).max(200).optional().nullable(),
    bedrooms: z.coerce.number().int().min(0).max(50),
    bathrooms: z.coerce.number().int().min(0).max(50),
    finishing: z.enum(["none", "semi", "full", "super_lux", "ultra_lux", "furnished"]),
    paymentType: z.enum(["cash", "installments", "both"]).optional().nullable(),
    downPayment: num(0, 10_000_000_000).optional().nullable(),
    installmentYears: z.coerce.number().int().min(1).max(30).optional().nullable(),
    title: z.string().trim().min(8).max(120),
    description: z.string().trim().min(20).max(5000),
    images: z
      .array(z.object({ url: z.string().max(500), thumbnailUrl: z.string().max(500) }))
      .min(MIN_PHOTOS)
      .max(MAX_PHOTOS),
  })
  .superRefine((v, ctx) => {
    if (v.propertyType === "sale") {
      if (!v.paymentType) ctx.addIssue({ code: "custom", path: ["paymentType"], message: "required" })
      if (v.paymentType && v.paymentType !== "cash") {
        if (v.downPayment == null) ctx.addIssue({ code: "custom", path: ["downPayment"], message: "required" })
        if (v.installmentYears == null) ctx.addIssue({ code: "custom", path: ["installmentYears"], message: "required" })
      }
    }
    if (!v.cityId && !v.areaText) ctx.addIssue({ code: "custom", path: ["cityId"], message: "required" })
  })

export type ListingInput = z.input<typeof ListingSchema>

export async function submitListing(input: ListingInput): Promise<Result<{ id: string }>> {
  const lng = input?.lng === "en" ? "en" : "ar"
  const who = await requirePoster(lng)
  if ("error" in who) return who.error

  const parsed = ListingSchema.safeParse(input)
  if (!parsed.success) {
    const field = parsed.error.issues[0]?.path?.join(".") || ""
    return { success: false, code: "VALIDATION", message: tr(lng, `راجع البيانات (${field})`, `Please check the form (${field})`) }
  }
  const v = parsed.data

  // Photos must be ones this user uploaded
  const ownPrefix = `${publicUploadsPrefix()}/${BUCKET}/${userPhotoPrefix(who.id)}/`
  if (!v.images.every((i) => i.url.startsWith(ownPrefix) && i.thumbnailUrl.startsWith(ownPrefix) && !i.url.includes(".."))) {
    return { success: false, message: tr(lng, "صور غير صالحة، أعد رفعها", "Invalid photos, please upload them again") }
  }

  // Location: governorate must exist; city (if given) must belong to it
  const loc = await query<{ gov_ar: string; gov_en: string; city_ar: string | null; city_en: string | null; city_id: string | null }>(
    `SELECT g.name_ar AS gov_ar, g.name_en AS gov_en, c.name_ar AS city_ar, c.name_en AS city_en, c.id AS city_id
       FROM locations g LEFT JOIN locations c ON c.id = $2 AND c.parent_id = g.id
      WHERE g.id = $1 AND g.parent_id IS NULL`,
    [v.governorateId, v.cityId || null],
  )
  const place = loc.rows[0]
  if (!place || (v.cityId && !place.city_id)) return { success: false, message: tr(lng, "اختر المحافظة والمنطقة", "Choose the governorate and area") }

  const cat = await query(`SELECT id FROM categories WHERE id = $1`, [v.categoryId])
  if (!cat.rows[0]) return { success: false, message: tr(lng, "اختر نوع العقار", "Choose the property type") }

  const areaName = v.areaText || (lng === "ar" ? place.city_ar : place.city_en) || ""
  const areaLabel = [areaName, lng === "ar" ? place.gov_ar : place.gov_en].filter(Boolean).join("، ")
  const isSale = v.propertyType === "sale"
  const contactName = who.account_type === "broker" && who.office_name ? who.office_name : who.full_name || who.email

  const fields = {
    title: v.title,
    title_ar: lng === "ar" ? v.title : null,
    title_en: lng === "en" ? v.title : null,
    description: v.description,
    description_ar: lng === "ar" ? v.description : null,
    description_en: lng === "en" ? v.description : null,
    price: v.price,
    price_per_meter: Math.round(v.price / v.size),
    location: v.address,
    location_ar: lng === "ar" ? `${v.address}، ${areaLabel}` : null,
    location_en: lng === "en" ? `${v.address}, ${areaLabel}` : null,
    area: areaName || (lng === "ar" ? place.gov_ar : place.gov_en),
    bedrooms: v.bedrooms,
    bathrooms: v.bathrooms,
    size: v.size,
    floor: v.floor ?? null,
    total_floors: v.totalFloors ?? null,
    category_id: v.categoryId,
    property_type: v.propertyType,
    owner_type: who.account_type,
    finishing: v.finishing,
    payment_type: isSale ? v.paymentType : null,
    down_payment: isSale && v.paymentType !== "cash" ? v.downPayment ?? null : null,
    installment_years: isSale && v.paymentType !== "cash" ? v.installmentYears ?? null : null,
    location_id: place.city_id || v.governorateId,
    contact_name: contactName,
    contact_phone: who.phone,
    contact_whatsapp: who.whatsapp || who.phone,
    contact_email: who.email,
    thumbnail_url: v.images[0].thumbnailUrl,
  }

  const client = await pool.connect()
  let propertyId = v.id
  let removedImages: { url: string; thumbnail_url: string | null }[] = []
  try {
    await client.query("BEGIN")

    if (propertyId) {
      const own = await client.query(`SELECT owner_id FROM properties WHERE id = $1 FOR UPDATE`, [propertyId])
      if (own.rows[0]?.owner_id !== who.id) {
        await client.query("ROLLBACK")
        return { success: false, message: tr(lng, "لا يمكنك تعديل هذا الإعلان", "You can't edit this listing") }
      }
      const cols = Object.keys(fields)
      const set = cols.map((c, i) => `"${c}" = $${i + 2}${c === "property_type" ? "::property_type" : c === "owner_type" ? "::owner_type" : ""}`)
      await client.query(
        `UPDATE properties SET ${set.join(", ")},
            moderation_status = 'pending', rejection_reason = NULL, submitted_at = now(), updated_at = now()
          WHERE id = $1`,
        [propertyId, ...cols.map((c) => (fields as any)[c])],
      )
      const old = await client.query(`SELECT url, thumbnail_url FROM property_images WHERE property_id = $1`, [propertyId])
      const keep = new Set(v.images.map((i) => i.url))
      removedImages = old.rows.filter((r: any) => !keep.has(r.url))
      await client.query(`DELETE FROM property_images WHERE property_id = $1`, [propertyId])
    } else {
      const limit = await getListingLimit(who)
      const used = await countActiveListings(who.id)
      if (used >= limit) {
        await client.query("ROLLBACK")
        return {
          success: false,
          code: "LIMIT",
          message: tr(lng, `وصلت للحد الأقصى (${limit} إعلانات). أوقف أو احذف إعلاناً قديماً لتنشر إعلاناً جديداً.`, `You reached your limit of ${limit} listings. Pause or delete one to post a new one.`),
        }
      }
      const cols = Object.keys(fields)
      const placeholders = cols.map((c, i) => `$${i + 2}${c === "property_type" ? "::property_type" : c === "owner_type" ? "::owner_type" : ""}`)
      const res = await client.query(
        `INSERT INTO properties (id, ${cols.map((c) => `"${c}"`).join(", ")},
            owner_id, status, moderation_status, submitted_at, is_new, is_featured, is_verified, features, amenities, created_at, updated_at)
         VALUES ($1, ${placeholders.join(", ")}, $${cols.length + 2}, 'active', 'pending', now(), false, false, false, '{}', '{}', now(), now())
         RETURNING id`,
        [randomUUID(), ...cols.map((c) => (fields as any)[c]), who.id],
      )
      propertyId = res.rows[0].id
    }

    for (const [i, img] of v.images.entries()) {
      await client.query(
        `INSERT INTO property_images (property_id, url, thumbnail_url, alt_text, order_index, is_main)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [propertyId, img.url, img.thumbnailUrl, v.title, i, i === 0],
      )
    }
    await client.query("COMMIT")
  } catch (e) {
    await client.query("ROLLBACK").catch(() => {})
    console.error("submitListing failed", e)
    return { success: false, message: tr(lng, "حدث خطأ أثناء الحفظ، حاول مرة أخرى", "Something went wrong while saving, please try again") }
  } finally {
    client.release()
  }

  await removeFiles(removedImages)
  revalidatePath("/", "layout")
  return { success: true, id: propertyId! }
}

async function removeFiles(rows: { url: string; thumbnail_url: string | null }[]) {
  const paths = rows.flatMap((r) => [r.url, r.thumbnail_url]).map((u) => (u ? pathFromPublicUrl(BUCKET, u) : null))
  const own = paths.filter((p): p is string => !!p && p.startsWith("listings/"))
  if (own.length) await storage.from(BUCKET).remove(own)
}

// ---------------------------------------------------------------- owner's listing management

export interface MyListing {
  id: string
  title: string
  price: number
  property_type: "sale" | "rent"
  status: string
  moderation_status: "pending" | "approved" | "rejected"
  rejection_reason: string | null
  area: string | null
  size: number
  views: number
  whatsapp_clicks: number
  call_clicks: number
  thumbnail_url: string | null
  created_at: string
  submitted_at: string | null
  favorites_count: number
  conversations_count: number
}

export async function getMyListings(): Promise<{ listings: MyListing[]; limit: number; used: number } | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const res = await query<MyListing>(
    `SELECT id, COALESCE(title_ar, title_en, title) AS title, price, property_type, status, moderation_status,
            rejection_reason, area, size, COALESCE(views, 0) AS views, whatsapp_clicks, call_clicks,
            thumbnail_url, created_at, submitted_at,
            (SELECT count(*)::int FROM loved_properties f WHERE f.property_id = properties.id) AS favorites_count,
            (SELECT count(*)::int FROM conversations c WHERE c.property_id = properties.id) AS conversations_count
       FROM properties WHERE owner_id = $1 ORDER BY created_at DESC`,
    [user.id],
  )
  return { listings: res.rows, limit: await getListingLimit(user), used: await countActiveListings(user.id) }
}

/** Data to prefill the wizard when editing. Only the owner gets it. */
export async function getMyListingForEdit(id: string) {
  const user = await getCurrentUser()
  if (!user || !UUID.test(id)) return null
  const res = await query(
    `SELECT p.*, l.parent_id AS location_parent_id, l.level AS location_level
       FROM properties p LEFT JOIN locations l ON l.id = p.location_id
      WHERE p.id = $1 AND p.owner_id = $2`,
    [id, user.id],
  )
  const p = res.rows[0]
  if (!p) return null
  const imgs = await query(`SELECT url, thumbnail_url FROM property_images WHERE property_id = $1 ORDER BY order_index`, [id])
  return { property: p, images: imgs.rows.map((r: any) => ({ url: r.url, thumbnailUrl: r.thumbnail_url || r.url })) }
}

export async function updateMyListingStatus(
  id: string,
  action: "pause" | "resume" | "sold" | "rented" | "delete",
  lng: string = "ar",
): Promise<Result> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: tr(lng, "يجب تسجيل الدخول", "Please sign in") }
  if (!UUID.test(id)) return { success: false, message: "Invalid listing" }
  const own = await query(`SELECT id, status FROM properties WHERE id = $1 AND owner_id = $2`, [id, user.id])
  if (!own.rows[0]) return { success: false, message: tr(lng, "الإعلان غير موجود", "Listing not found") }

  if (action === "delete") {
    const imgs = await query(`SELECT url, thumbnail_url FROM property_images WHERE property_id = $1`, [id])
    await query(`DELETE FROM properties WHERE id = $1 AND owner_id = $2`, [id, user.id])
    await removeFiles(imgs.rows as any)
  } else if (action === "resume") {
    // counts against the limit again
    const limit = await getListingLimit(user)
    const used = await countActiveListings(user.id)
    const counted = own.rows[0].status === "active" || own.rows[0].status === "inactive"
    if (!counted && used >= limit) {
      return { success: false, message: tr(lng, `وصلت للحد الأقصى (${limit} إعلانات)`, `You reached your limit of ${limit} listings`) }
    }
    await query(`UPDATE properties SET status = 'active', sold_at = NULL, updated_at = now() WHERE id = $1`, [id])
  } else {
    const status = action === "pause" ? "inactive" : action
    await query(
      `UPDATE properties SET status = $2::property_status, sold_at = CASE WHEN $3::boolean THEN now() ELSE sold_at END, updated_at = now() WHERE id = $1`,
      [id, status, status === "sold" || status === "rented"],
    )
  }
  revalidatePath("/", "layout")
  return { success: true }
}

// ---------------------------------------------------------------- public: contact tracking, reports, favorites

export async function trackListingEvent(id: string, kind: "view" | "whatsapp" | "call" | "phone_reveal" | "share") {
  if (!UUID.test(id) || !["view", "whatsapp", "call", "phone_reveal", "share"].includes(kind)) return
  const column = kind === "view" ? "views" : kind === "whatsapp" ? "whatsapp_clicks" : kind === "call" || kind === "phone_reveal" ? "call_clicks" : null
  try {
    const res = await query(
      column
        ? `UPDATE properties SET "${column}" = COALESCE("${column}", 0) + 1 WHERE id = $1 AND status = 'active' AND moderation_status = 'approved' RETURNING id`
        : `SELECT id FROM properties WHERE id = $1 AND status = 'active' AND moderation_status = 'approved'`,
      [id],
    )
    if (res.rows[0]) await query(`INSERT INTO listing_events (property_id, kind) VALUES ($1, $2)`, [id, kind])
  } catch {
    // tracking must never break the page
  }
}

const ReportSchema = z.object({
  propertyId: z.string().regex(UUID),
  reason: z.enum(["sold", "wrong_price", "wrong_info", "fake", "duplicate", "scam", "other"]),
  details: z.string().trim().max(1000).optional().default(""),
})

export async function reportListing(input: z.input<typeof ReportSchema>, lng: string = "ar"): Promise<Result> {
  const parsed = ReportSchema.safeParse(input)
  if (!parsed.success) return { success: false, message: tr(lng, "اختر سبب البلاغ", "Choose a reason") }
  const { propertyId, reason, details } = parsed.data
  const user = await getCurrentUser()
  const h = await headers()
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || null

  const exists = await query(`SELECT 1 FROM properties WHERE id = $1`, [propertyId])
  if (!exists.rows[0]) return { success: false, message: tr(lng, "الإعلان غير موجود", "Listing not found") }

  // one open report per person per listing
  const dup = await query(
    `SELECT 1 FROM listing_reports WHERE property_id = $1 AND status = 'open'
        AND ((reporter_id IS NOT NULL AND reporter_id = $2) OR (ip_address IS NOT NULL AND ip_address = $3::inet))`,
    [propertyId, user?.id ?? null, ip && /^[0-9a-f.:]+$/i.test(ip) ? ip : null],
  )
  if (dup.rows[0]) return { success: true }

  await query(
    `INSERT INTO listing_reports (property_id, reporter_id, reason, details, ip_address) VALUES ($1, $2, $3, $4, $5::inet)`,
    [propertyId, user?.id ?? null, reason, details || null, ip && /^[0-9a-f.:]+$/i.test(ip) ? ip : null],
  )
  return { success: true }
}

/** Public: approved, active listings by id (for the favorites page, which keeps ids in the browser). */
export async function getListingsByIds(ids: string[]) {
  const clean = (Array.isArray(ids) ? ids : []).filter((i) => typeof i === "string" && UUID.test(i)).slice(0, 60)
  if (!clean.length) return []
  const { db } = await import("@/lib/db")
  const { data } = await db
    .from("properties")
    .select(`*, categories (*), property_images (*)`)
    .in("id", clean)
    .eq("status", "active")
    .eq("moderation_status", "approved")
  return (data || []).map((p: any) => {
    p.property_images?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    return p
  })
}
