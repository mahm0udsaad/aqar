/** Options and helpers shared by the listing wizard, listing pages and server actions. */

export type Lang = "ar" | "en"
export const tr = (lng: string, ar: string, en: string) => (lng === "ar" ? ar : en)

export const FINISHING = [
  { value: "none", ar: "بدون تشطيب", en: "Not finished" },
  { value: "semi", ar: "نصف تشطيب", en: "Semi-finished" },
  { value: "full", ar: "تشطيب كامل", en: "Fully finished" },
  { value: "super_lux", ar: "سوبر لوكس", en: "Super lux" },
  { value: "ultra_lux", ar: "ألترا سوبر لوكس", en: "Ultra super lux" },
  { value: "furnished", ar: "مفروش", en: "Furnished" },
] as const
export type Finishing = (typeof FINISHING)[number]["value"]

export const PAYMENT_TYPES = [
  { value: "cash", ar: "كاش", en: "Cash" },
  { value: "installments", ar: "تقسيط", en: "Installments" },
  { value: "both", ar: "كاش أو تقسيط", en: "Cash or installments" },
] as const
export type PaymentType = (typeof PAYMENT_TYPES)[number]["value"]

export const REPORT_REASONS = [
  { value: "sold", ar: "العقار تم بيعه أو تأجيره", en: "Already sold or rented" },
  { value: "wrong_price", ar: "السعر غير صحيح", en: "Wrong price" },
  { value: "wrong_info", ar: "بيانات أو صور غير صحيحة", en: "Wrong details or photos" },
  { value: "duplicate", ar: "إعلان مكرر", en: "Duplicate listing" },
  { value: "fake", ar: "إعلان وهمي", en: "Fake listing" },
  { value: "scam", ar: "احتيال", en: "Scam" },
  { value: "other", ar: "سبب آخر", en: "Other" },
] as const
export type ReportReason = (typeof REPORT_REASONS)[number]["value"]

export const MIN_PHOTOS = 3
export const MAX_PHOTOS = 15

export function labelOf<T extends { value: string; ar: string; en: string }>(
  list: readonly T[],
  value: string | null | undefined,
  lng: string,
) {
  const item = list.find((i) => i.value === value)
  return item ? (lng === "ar" ? item.ar : item.en) : null
}

/**
 * Normalize an Egyptian mobile number to +20XXXXXXXXXX.
 * Accepts 01XXXXXXXXX, 1XXXXXXXXX, 201XXXXXXXXX, +201XXXXXXXXX, 00201XXXXXXXXX
 * (with spaces/dashes, Arabic-Indic digits too). Returns null if invalid.
 */
export function normalizeEgyptPhone(input: string | null | undefined): string | null {
  if (!input) return null
  const western = input.replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d))).replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
  let digits = western.replace(/[^\d]/g, "")
  if (digits.startsWith("0020")) digits = digits.slice(4)
  else if (digits.startsWith("20") && digits.length === 12) digits = digits.slice(2)
  if (digits.startsWith("0")) digits = digits.slice(1)
  if (!/^1[0125]\d{8}$/.test(digits)) return null
  return `+20${digits}`
}

/** "+201001234567" -> "201001234567" for wa.me links */
export function whatsappDigits(phone: string | null | undefined) {
  return (phone || "").replace(/[^\d]/g, "")
}

/** Local display: "+201001234567" -> "0100 123 4567" */
export function formatEgyptPhone(phone: string | null | undefined) {
  const n = normalizeEgyptPhone(phone)
  if (!n) return phone || ""
  const local = `0${n.slice(3)}`
  return `${local.slice(0, 4)} ${local.slice(4, 7)} ${local.slice(7)}`
}

/** Suggested title, e.g. "شقة للبيع في سموحة 120م²" */
export function suggestTitle(opts: {
  lng: string
  categoryName?: string | null
  propertyType?: "sale" | "rent" | null
  place?: string | null
  size?: number | null
}) {
  const { lng, categoryName, propertyType, place, size } = opts
  if (!categoryName) return ""
  if (lng === "ar") {
    const purpose = propertyType === "rent" ? "للإيجار" : "للبيع"
    return [categoryName, purpose, place ? `في ${place}` : "", size ? `${size}م²` : ""].filter(Boolean).join(" ")
  }
  const purpose = propertyType === "rent" ? "for rent" : "for sale"
  return [categoryName, purpose, place ? `in ${place}` : "", size ? `${size}m²` : ""].filter(Boolean).join(" ")
}

/** Singular category nouns for generated titles ("شقة للبيع ..."), keyed by category slug. */
export const CATEGORY_SINGULAR: Record<string, { ar: string; en: string }> = {
  apartments: { ar: "شقة", en: "Apartment" },
  villas: { ar: "فيلا", en: "Villa" },
  townhouses: { ar: "تاون هاوس", en: "Townhouse" },
  penthouses: { ar: "بنتهاوس", en: "Penthouse" },
  land: { ar: "أرض", en: "Land" },
  commercial: { ar: "محل تجاري", en: "Commercial unit" },
}

export function categoryLabel(cat: { name?: string | null; name_ar?: string | null; name_en?: string | null } | null | undefined, lng: string) {
  if (!cat) return null
  return lng === "ar" ? cat.name_ar || cat.name || null : cat.name_en || cat.name || null
}
