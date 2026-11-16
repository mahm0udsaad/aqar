"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { resolveReport, type ReportItem } from "@/lib/actions/moderation"
import { REPORT_REASONS, labelOf, tr } from "@/lib/listing-options"

export function ReportsList({ lng, items }: { lng: string; items: ReportItem[] }) {
  const router = useRouter()
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const [pending, start] = useTransition()

  const act = (id: string, outcome: "resolved" | "dismissed", hide = false) =>
    start(async () => {
      const res = await resolveReport(id, outcome, hide)
      if (res.success) {
        toast.success(hide ? t("تم إيقاف الإعلان", "Listing taken down") : t("تم إغلاق البلاغ", "Report closed"))
        router.refresh()
      } else toast.error(res.message)
    })

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="p-10 text-center text-muted-foreground">{t("لا توجد بلاغات مفتوحة.", "No open reports.")}</CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {items.map((r) => (
        <Card key={r.id} className={pending ? "opacity-70" : ""}>
          <CardContent className="p-4 space-y-2">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <Link href={`/${lng}/properties/${r.property_id}`} target="_blank" className="font-semibold hover:underline">
                  {r.property_title}
                </Link>
                <div className="text-xs text-muted-foreground">
                  {new Date(r.created_at).toLocaleString(lng === "ar" ? "ar-EG" : "en-GB")} · {r.reporter_email || t("زائر", "visitor")}
                </div>
              </div>
              <div className="flex gap-2">
                <Badge variant="destructive">{labelOf(REPORT_REASONS, r.reason, lng)}</Badge>
                {r.open_reports_for_listing > 1 && (
                  <Badge variant="outline">{t(`${r.open_reports_for_listing} بلاغات على الإعلان`, `${r.open_reports_for_listing} reports on this listing`)}</Badge>
                )}
              </div>
            </div>
            {r.details && <p className="text-sm bg-muted rounded p-2">{r.details}</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="destructive" onClick={() => act(r.id, "resolved", true)} disabled={pending}>
                {t("إيقاف الإعلان", "Take listing down")}
              </Button>
              <Button size="sm" variant="outline" onClick={() => act(r.id, "resolved")} disabled={pending}>
                {t("تم الحل", "Mark resolved")}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => act(r.id, "dismissed")} disabled={pending}>
                {t("تجاهل", "Dismiss")}
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
