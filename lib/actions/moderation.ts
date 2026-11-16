"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { query } from "@/lib/db/pool"
import { getAdminUser } from "@/lib/auth/session"

const UUID = /^[0-9a-f-]{36}$/i

export interface ModerationFlag {
  kind: "price_low" | "price_high" | "duplicate" | "few_photos" | "new_account"
  detail: string
}

export interface QueueItem {
  id: string
  title: string
  description: string
  price: number
  size: number
  price_per_meter: number | null
  property_type: string
  area: string | null
  category_name: string | null
  category_name_ar: string | null
  thumbnail_url: string | null
  submitted_at: string | null
  owner_name: string | null
  owner_email: string | null
  owner_phone: string | null
  owner_type: string | null
  photo_count: number
  owner_listings: number
  flags: ModerationFlag[]
}

/**
 * Pending listings with automatic checks:
 * price per m² far from the median of similar approved listings, the same phone already
 * listing a unit of about the same size in the same area, too few photos, brand-new account.
 */
export async function getModerationQueue(): Promise<QueueItem[] | null> {
  if (!(await getAdminUser())) return null
  const res = await query<any>(
    `SELECT p.id, COALESCE(p.title_ar, p.title_en, p.title) AS title, COALESCE(p.description_ar, p.description_en, p.description) AS description,
            p.price, p.size, p.price_per_meter, p.property_type::text, p.area, p.category_id, p.contact_phone,
            c.name AS category_name, c.name_ar AS category_name_ar, p.thumbnail_url, p.submitted_at,
            u.full_name AS owner_name, u.email AS owner_email, u.phone AS owner_phone, u.account_type AS owner_type,
            u.created_at AS owner_created_at,
            (SELECT count(*)::int FROM property_images i WHERE i.property_id = p.id) AS photo_count,
            (SELECT count(*)::int FROM properties o WHERE o.owner_id = p.owner_id) AS owner_listings,
            (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price / NULLIF(s.size, 0))
               FROM properties s
              WHERE s.moderation_status = 'approved' AND s.category_id = p.category_id
                AND s.property_type = p.property_type AND s.size > 0) AS median_ppm,
            (SELECT count(*)::int FROM properties s
              WHERE s.moderation_status = 'approved' AND s.category_id = p.category_id
                AND s.property_type = p.property_type AND s.size > 0) AS comparable_count,
            (SELECT count(*)::int FROM properties d
              WHERE d.id <> p.id AND d.contact_phone = p.contact_phone AND d.area = p.area
                AND d.property_type = p.property_type AND d.size BETWEEN p.size * 0.95 AND p.size * 1.05
                AND d.status IN ('active', 'inactive')) AS duplicate_count
       FROM properties p
       LEFT JOIN categories c ON c.id = p.category_id
       LEFT JOIN user_profiles u ON u.id = p.owner_id
      WHERE p.moderation_status = 'pending'
      ORDER BY p.submitted_at ASC NULLS LAST`,
  )

  return res.rows.map((r: any) => {
    const flags: ModerationFlag[] = []
    const ppm = r.size > 0 ? r.price / r.size : null
    if (ppm && r.median_ppm && r.comparable_count >= 3) {
      const ratio = ppm / r.median_ppm
      if (ratio < 0.4) flags.push({ kind: "price_low", detail: `${Math.round(ratio * 100)}% of median (${Math.round(r.median_ppm)}/m²)` })
      if (ratio > 2.5) flags.push({ kind: "price_high", detail: `${Math.round(ratio * 100)}% of median (${Math.round(r.median_ppm)}/m²)` })
    }
    if (r.duplicate_count > 0) flags.push({ kind: "duplicate", detail: `${r.duplicate_count} similar listing(s) with the same phone and area` })
    if (r.photo_count < 3) flags.push({ kind: "few_photos", detail: `${r.photo_count} photo(s)` })
    if (r.owner_created_at && Date.now() - new Date(r.owner_created_at).getTime() < 24 * 3600 * 1000) {
      flags.push({ kind: "new_account", detail: "Account created in the last 24 hours" })
    }
    return { ...r, flags }
  })
}

export async function approveListing(id: string) {
  const admin = await getAdminUser()
  if (!admin) return { success: false, message: "Admin access required" }
  if (!UUID.test(id)) return { success: false, message: "Invalid listing" }
  await query(
    `UPDATE properties SET moderation_status = 'approved', rejection_reason = NULL, reviewed_at = now(), reviewed_by = $2,
            published_at = COALESCE(published_at, now()), updated_at = now()
      WHERE id = $1 AND moderation_status = 'pending'`,
    [id, admin.id],
  )
  revalidatePath("/", "layout")
  return { success: true }
}

const RejectSchema = z.object({ id: z.string().regex(UUID), reason: z.string().trim().min(3).max(500) })

export async function rejectListing(id: string, reason: string) {
  const admin = await getAdminUser()
  if (!admin) return { success: false, message: "Admin access required" }
  const parsed = RejectSchema.safeParse({ id, reason })
  if (!parsed.success) return { success: false, message: "Write the reason the owner will see" }
  await query(
    `UPDATE properties SET moderation_status = 'rejected', rejection_reason = $2, reviewed_at = now(), reviewed_by = $3, updated_at = now()
      WHERE id = $1`,
    [parsed.data.id, parsed.data.reason, admin.id],
  )
  revalidatePath("/", "layout")
  return { success: true }
}

export async function getPendingCounts() {
  if (!(await getAdminUser())) return { pending: 0, reports: 0 }
  const res = await query<{ pending: number; reports: number }>(
    `SELECT (SELECT count(*)::int FROM properties WHERE moderation_status = 'pending') AS pending,
            (SELECT count(*)::int FROM listing_reports WHERE status = 'open') AS reports`,
  )
  return res.rows[0]
}

export interface ReportItem {
  id: string
  reason: string
  details: string | null
  status: string
  created_at: string
  property_id: string
  property_title: string
  property_status: string
  moderation_status: string
  reporter_email: string | null
  open_reports_for_listing: number
}

export async function getReports(status: "open" | "resolved" | "dismissed" = "open"): Promise<ReportItem[] | null> {
  if (!(await getAdminUser())) return null
  const res = await query<ReportItem>(
    `SELECT r.id, r.reason, r.details, r.status, r.created_at, r.property_id,
            COALESCE(p.title_ar, p.title_en, p.title) AS property_title, p.status::text AS property_status, p.moderation_status,
            u.email AS reporter_email,
            (SELECT count(*)::int FROM listing_reports x WHERE x.property_id = r.property_id AND x.status = 'open') AS open_reports_for_listing
       FROM listing_reports r
       JOIN properties p ON p.id = r.property_id
       LEFT JOIN user_profiles u ON u.id = r.reporter_id
      WHERE r.status = $1
      ORDER BY r.created_at DESC
      LIMIT 200`,
    [status],
  )
  return res.rows
}

/** Close a report; optionally take the listing down (back to review, hidden from the public). */
export async function resolveReport(id: string, outcome: "resolved" | "dismissed", hideListing = false) {
  const admin = await getAdminUser()
  if (!admin) return { success: false, message: "Admin access required" }
  if (!UUID.test(id) || !["resolved", "dismissed"].includes(outcome)) return { success: false, message: "Invalid request" }
  const res = await query<{ property_id: string }>(
    `UPDATE listing_reports SET status = $2, resolved_at = now(), resolved_by = $3 WHERE id = $1 RETURNING property_id`,
    [id, outcome, admin.id],
  )
  const propertyId = res.rows[0]?.property_id
  if (propertyId && hideListing) {
    await query(
      `UPDATE properties SET moderation_status = 'rejected', rejection_reason = $2, reviewed_at = now(), reviewed_by = $3 WHERE id = $1`,
      [propertyId, "تم إيقاف الإعلان بعد بلاغ من الزوار. عدّل البيانات وأعد إرساله للمراجعة.", admin.id],
    )
    // close the other open reports on the same listing too
    await query(`UPDATE listing_reports SET status = 'resolved', resolved_at = now(), resolved_by = $2 WHERE property_id = $1 AND status = 'open'`, [propertyId, admin.id])
  }
  revalidatePath("/", "layout")
  return { success: true }
}
