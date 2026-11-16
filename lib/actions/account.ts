"use server"

import { z } from "zod"
import { revalidatePath } from "next/cache"
import { query } from "@/lib/db/pool"
import { getCurrentUser } from "@/lib/auth/session"
import { normalizeEgyptPhone } from "@/lib/listing-options"

export type AccountActionResult = { success: boolean; message?: string; fieldErrors?: Record<string, string> }

const ProfileSchema = z.object({
  account_type: z.enum(["owner", "broker"]),
  full_name: z.string().trim().min(2).max(80),
  phone: z.string().trim().min(8).max(25),
  whatsapp: z.string().trim().max(25).optional().default(""),
  office_name: z.string().trim().max(120).optional().default(""),
  license_number: z.string().trim().max(40).optional().default(""),
})

/** Saves the first-time setup (owner/broker, name, phone) and later profile edits. */
export async function saveProfile(input: z.input<typeof ProfileSchema>, lng: string = "ar"): Promise<AccountActionResult> {
  const user = await getCurrentUser()
  if (!user) return { success: false, message: lng === "ar" ? "يجب تسجيل الدخول" : "Please sign in" }

  const parsed = ProfileSchema.safeParse(input)
  if (!parsed.success) {
    return { success: false, message: lng === "ar" ? "راجع البيانات المطلوبة" : "Please check the required fields" }
  }
  const data = parsed.data
  const fieldErrors: Record<string, string> = {}

  const phone = normalizeEgyptPhone(data.phone)
  if (!phone) fieldErrors.phone = lng === "ar" ? "اكتب رقم موبايل مصري صحيح (مثال 01001234567)" : "Enter a valid Egyptian mobile (e.g. 01001234567)"
  const whatsapp = data.whatsapp ? normalizeEgyptPhone(data.whatsapp) : phone
  if (data.whatsapp && !whatsapp) fieldErrors.whatsapp = lng === "ar" ? "رقم واتساب غير صحيح" : "Invalid WhatsApp number"
  if (data.account_type === "broker" && !data.office_name) {
    fieldErrors.office_name = lng === "ar" ? "اكتب اسم المكتب أو الشركة" : "Enter your office or company name"
  }
  if (Object.keys(fieldErrors).length) return { success: false, fieldErrors }

  await query(
    `UPDATE user_profiles
        SET account_type = $2, full_name = $3, phone = $4, whatsapp = $5,
            office_name = $6, license_number = $7,
            onboarded_at = COALESCE(onboarded_at, now()), updated_at = now()
      WHERE id = $1`,
    [
      user.id,
      data.account_type,
      data.full_name,
      phone,
      whatsapp,
      data.account_type === "broker" ? data.office_name : null,
      data.account_type === "broker" ? data.license_number || null : null,
    ],
  )

  // Keep contact details on the user's own listings in sync with the profile
  await query(
    `UPDATE properties SET contact_name = $2, contact_phone = $3, contact_whatsapp = $4, owner_type = $5::owner_type, updated_at = now()
      WHERE owner_id = $1`,
    [
      user.id,
      data.account_type === "broker" && data.office_name ? data.office_name : data.full_name,
      phone,
      whatsapp,
      data.account_type,
    ],
  )

  revalidatePath("/", "layout")
  return { success: true }
}
