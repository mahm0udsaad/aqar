"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { AlertTriangle, Check, ExternalLink, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { approveListing, rejectListing, type QueueItem } from "@/lib/actions/moderation"
import { tr } from "@/lib/listing-options"
import { assetUrl } from "@/lib/utils"

const FLAG_LABELS: Record<string, [string, string]> = {
  price_low: ["سعر المتر أقل بكثير من المعتاد", "Price per m² far below normal"],
  price_high: ["سعر المتر أعلى بكثير من المعتاد", "Price per m² far above normal"],
  duplicate: ["قد يكون مكرراً (نفس الرقم والمنطقة والمساحة)", "Possible duplicate (same phone, area and size)"],
  few_photos: ["صور أقل من المطلوب", "Too few photos"],
  new_account: ["حساب جديد", "New account"],
}

const QUICK_REASONS: [string, string][] = [
  ["الصور غير واضحة أو لا تخص العقار. أضف صوراً حقيقية للعقار.", "Photos are unclear or not of the property. Add real photos."],
  ["السعر غير منطقي. راجع السعر والمساحة.", "The price doesn't look right. Check the price and size."],
  ["الإعلان مكرر لعقار منشور بالفعل.", "This duplicates a listing that is already live."],
  ["البيانات ناقصة أو غير صحيحة. راجع الوصف والموقع.", "Details are missing or wrong. Check the description and location."],
  ["الإعلان مخالف لشروط النشر.", "The listing breaks the posting rules."],
]

export function ModerationQueue({ lng, items }: { lng: string; items: QueueItem[] }) {
  const router = useRouter()
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const [pending, start] = useTransition()
  const [rejecting, setRejecting] = useState<QueueItem | null>(null)
  const [reason, setReason] = useState("")
  const fmt = (n: number) => Number(n || 0).toLocaleString(lng === "ar" ? "ar-EG" : "en-US")

  const approve = (id: string) =>
    start(async () => {
      const res = await approveListing(id)
      if (res.success) {
        toast.success(t("تمت الموافقة ونُشر الإعلان", "Approved and published"))
        router.refresh()
      } else toast.error(res.message)
    })

  const reject = () => {
    if (!rejecting) return
    start(async () => {
      const res = await rejectListing(rejecting.id, reason)
      if (res.success) {
        toast.success(t("تم رفض الإعلان وإبلاغ صاحبه بالسبب", "Rejected; the owner will see the reason"))
        setRejecting(null)
        setReason("")
        router.refresh()
      } else toast.error(res.message)
    })
  }

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">
          {t("لا توجد إعلانات بانتظار المراجعة.", "No listings waiting for review.")}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t(`${items.length} إعلان بانتظار المراجعة (الأقدم أولاً)`, `${items.length} listing(s) waiting (oldest first)`)}</p>
      {items.map((item) => (
        <Card key={item.id} className={pending ? "opacity-70" : ""}>
          <CardContent className="p-4 flex flex-col md:flex-row gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={assetUrl(item.thumbnail_url || "/placeholder.svg")} alt="" className="w-full md:w-48 h-36 object-cover rounded-md bg-muted" />
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="font-semibold text-lg leading-tight">{item.title}</div>
                  <div className="text-sm text-muted-foreground">
                    {[lng === "ar" ? item.category_name_ar || item.category_name : item.category_name, item.property_type === "rent" ? t("إيجار", "Rent") : t("بيع", "Sale"), item.area].filter(Boolean).join(" · ")}
                  </div>
                </div>
                <div className="text-end">
                  <div className="font-bold">{fmt(item.price)} {t("ج.م", "EGP")}</div>
                  <div className="text-xs text-muted-foreground">
                    {item.size} {t("م²", "m²")} · {fmt(item.price_per_meter || Math.round(item.price / (item.size || 1)))} {t("ج.م/م²", "EGP/m²")}
                  </div>
                </div>
              </div>

              <p className="text-sm line-clamp-3">{item.description}</p>

              <div className="text-xs text-muted-foreground">
                {t("المعلن: ", "Advertiser: ")}
                {item.owner_name || "—"} ({item.owner_type === "broker" ? t("وسيط", "broker") : t("مالك", "owner")}) · <span dir="ltr">{item.owner_phone}</span> · {item.owner_email} ·{" "}
                {t(`${item.owner_listings} إعلان`, `${item.owner_listings} listing(s)`)} · {t(`${item.photo_count} صور`, `${item.photo_count} photos`)}
              </div>

              {item.flags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {item.flags.map((f, i) => (
                    <Badge key={i} variant="outline" className="border-amber-300 bg-amber-50 text-amber-900 gap-1 font-normal" title={f.detail}>
                      <AlertTriangle className="w-3 h-3" />
                      {lng === "ar" ? FLAG_LABELS[f.kind]?.[0] : FLAG_LABELS[f.kind]?.[1]}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-1">
                <Button size="sm" onClick={() => approve(item.id)} disabled={pending} className="bg-green-600 hover:bg-green-700">
                  <Check className="w-4 h-4 me-1" />
                  {t("موافقة ونشر", "Approve")}
                </Button>
                <Button size="sm" variant="outline" onClick={() => setRejecting(item)} disabled={pending} className="text-destructive">
                  <X className="w-4 h-4 me-1" />
                  {t("رفض", "Reject")}
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link href={`/${lng}/properties/${item.id}`} target="_blank">
                    <ExternalLink className="w-4 h-4 me-1" />
                    {t("معاينة كاملة", "Full preview")}
                  </Link>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent dir={lng === "ar" ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t("سبب الرفض (يظهر لصاحب الإعلان)", "Reason (shown to the advertiser)")}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-wrap gap-2">
            {QUICK_REASONS.map(([ar, en]) => (
              <button key={ar} type="button" onClick={() => setReason(lng === "ar" ? ar : en)} className="text-xs rounded-full border px-3 py-1 hover:border-primary">
                {lng === "ar" ? ar : en}
              </button>
            ))}
          </div>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} maxLength={500} />
          <DialogFooter>
            <Button variant="destructive" onClick={reject} disabled={pending || reason.trim().length < 3}>
              {t("رفض الإعلان", "Reject listing")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
