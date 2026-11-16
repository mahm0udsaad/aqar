import Link from "next/link"
import { AlertCircle, Clock, PauseCircle, CheckCircle2 } from "lucide-react"
import { tr } from "@/lib/listing-options"

/** Shown to the owner (or an admin) when previewing a listing the public can't see. */
export function ListingStatusBanner({
  lng,
  id,
  status,
  moderationStatus,
  rejectionReason,
}: {
  lng: string
  id: string
  status: string
  moderationStatus: string
  rejectionReason?: string | null
}) {
  let tone = "bg-amber-50 border-amber-200 text-amber-900"
  let Icon = Clock
  let title = tr(lng, "إعلانك قيد المراجعة", "Your listing is under review")
  let body = tr(lng, "سيظهر للزوار بعد موافقة فريق عقار، عادةً خلال 24 ساعة. هذه معاينة لا يراها غيرك.", "It goes live after the Aqar team approves it, usually within 24 hours. Only you can see this preview.")

  if (moderationStatus === "rejected") {
    tone = "bg-red-50 border-red-200 text-red-900"
    Icon = AlertCircle
    title = tr(lng, "لم تتم الموافقة على الإعلان", "This listing was not approved")
    body = rejectionReason || tr(lng, "عدّل الإعلان وأعد إرساله للمراجعة.", "Edit the listing and send it for review again.")
  } else if (status === "inactive") {
    tone = "bg-slate-50 border-slate-200 text-slate-900"
    Icon = PauseCircle
    title = tr(lng, "الإعلان موقوف مؤقتاً", "This listing is paused")
    body = tr(lng, "لا يظهر للزوار. يمكنك تفعيله من صفحة إعلاناتي.", "Visitors can't see it. You can resume it from My listings.")
  } else if (status === "sold" || status === "rented") {
    tone = "bg-green-50 border-green-200 text-green-900"
    Icon = CheckCircle2
    title = status === "sold" ? tr(lng, "تم البيع", "Marked as sold") : tr(lng, "تم التأجير", "Marked as rented")
    body = tr(lng, "الإعلان لم يعد يظهر في البحث.", "It no longer appears in search.")
  }

  return (
    <div className={`mb-6 rounded-lg border p-4 flex flex-col sm:flex-row sm:items-center gap-3 ${tone}`}>
      <Icon className="w-5 h-5 shrink-0" />
      <div className="flex-1">
        <div className="font-semibold">{title}</div>
        <div className="text-sm opacity-90">{body}</div>
      </div>
      <div className="flex gap-2">
        <Link href={`/${lng}/account/listings/${id}/edit`} className="text-sm font-medium underline underline-offset-4">
          {tr(lng, "تعديل الإعلان", "Edit listing")}
        </Link>
        <Link href={`/${lng}/account/listings`} className="text-sm font-medium underline underline-offset-4">
          {tr(lng, "إعلاناتي", "My listings")}
        </Link>
      </div>
    </div>
  )
}
