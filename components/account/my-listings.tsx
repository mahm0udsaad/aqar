"use client"

import { useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { CheckCircle2, Eye, MessageCircle, MoreVertical, Pencil, Phone, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { updateMyListingStatus, type MyListing } from "@/lib/actions/listings"
import { tr } from "@/lib/listing-options"
import { assetUrl } from "@/lib/utils"
import { PostListingButton } from "@/components/nav/post-listing-button"

type Tab = "active" | "pending" | "rejected" | "paused" | "closed"

function tabOf(l: MyListing): Tab {
  if (l.status === "sold" || l.status === "rented") return "closed"
  if (l.moderation_status === "rejected") return "rejected"
  if (l.moderation_status === "pending") return "pending"
  if (l.status === "inactive" || l.status === "draft") return "paused"
  return "active"
}

export function MyListings({
  lng,
  listings,
  limit,
  used,
  justSubmitted,
}: {
  lng: string
  listings: MyListing[]
  limit: number
  used: number
  justSubmitted?: boolean
}) {
  const router = useRouter()
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const counts = useMemo(() => {
    const c: Record<Tab, number> = { active: 0, pending: 0, rejected: 0, paused: 0, closed: 0 }
    listings.forEach((l) => c[tabOf(l)]++)
    return c
  }, [listings])
  const [tab, setTab] = useState<Tab>(justSubmitted && counts.pending ? "pending" : counts.active || !counts.pending ? "active" : "pending")
  const [pending, start] = useTransition()
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const act = (id: string, action: "pause" | "resume" | "sold" | "rented" | "delete") =>
    start(async () => {
      const res = await updateMyListingStatus(id, action, lng)
      if (res.success) {
        toast.success(
          {
            pause: t("تم إيقاف الإعلان", "Listing paused"),
            resume: t("تم تفعيل الإعلان", "Listing resumed"),
            sold: t("تم تعليمه كمباع", "Marked as sold"),
            rented: t("تم تعليمه كمؤجر", "Marked as rented"),
            delete: t("تم حذف الإعلان", "Listing deleted"),
          }[action],
        )
        router.refresh()
      } else toast.error(res.message)
    })

  const tabs: [Tab, string][] = [
    ["active", t("نشط", "Live")],
    ["pending", t("قيد المراجعة", "In review")],
    ["rejected", t("مرفوض", "Rejected")],
    ["paused", t("موقوف", "Paused")],
    ["closed", t("تم البيع / التأجير", "Sold / rented")],
  ]
  const shown = listings.filter((l) => tabOf(l) === tab)
  const fmt = (n: number) => n.toLocaleString(lng === "ar" ? "ar-EG" : "en-US")

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">{t("إعلاناتي", "My listings")}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {t(`${used} من ${limit} إعلانات مجانية مستخدمة`, `${used} of ${limit} free listings used`)}
          </p>
        </div>
        <PostListingButton lng={lng} className="h-10" />
      </div>

      {justSubmitted && (
        <div className="rounded-lg border border-green-200 bg-green-50 text-green-900 p-4 flex gap-3">
          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold">{t("تم استلام إعلانك", "We received your listing")}</div>
            <div className="text-sm">{t("سيظهر للزوار بعد مراجعته، عادةً خلال 24 ساعة.", "It goes live after review, usually within 24 hours.")}</div>
          </div>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Tab)} dir={lng === "ar" ? "rtl" : "ltr"}>
        <TabsList className="flex flex-wrap h-auto justify-start">
          {tabs.map(([value, label]) => (
            <TabsTrigger key={value} value={value} className="gap-2">
              {label}
              <span className="rounded-full bg-muted-foreground/15 px-2 text-xs">{counts[value]}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {listings.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center space-y-4">
            <div className="text-lg font-semibold">{t("لم تنشر أي إعلان بعد", "You haven't posted any listing yet")}</div>
            <p className="text-muted-foreground">{t("انشر أول عقار لك مجاناً في دقيقتين.", "Post your first property for free in two minutes.")}</p>
            <Link href={`/${lng}/listings/new`}>
              <Button size="lg">
                <Plus className="w-4 h-4 me-1" />
                {t("أضف عقارك", "List a property")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : shown.length === 0 ? (
        <p className="text-muted-foreground py-8 text-center">{t("لا توجد إعلانات هنا.", "Nothing here.")}</p>
      ) : (
        <div className="space-y-3">
          {shown.map((l) => {
            const status = tabOf(l)
            return (
              <Card key={l.id} className={pending ? "opacity-70" : ""}>
                <CardContent className="p-3 sm:p-4 flex gap-3 sm:gap-4">
                  <Link href={`/${lng}/properties/${l.id}`} className="shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={assetUrl(l.thumbnail_url || "/placeholder.svg")}
                      alt=""
                      className="w-24 h-20 sm:w-36 sm:h-28 object-cover rounded-md bg-muted"
                    />
                  </Link>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <Link href={`/${lng}/properties/${l.id}`} className="font-semibold leading-tight hover:underline line-clamp-2">
                        {l.title}
                      </Link>
                      <DropdownMenu dir={lng === "ar" ? "rtl" : "ltr"}>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={t("خيارات", "Options")}>
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/${lng}/account/listings/${l.id}/edit`}>
                              <Pencil className="w-4 h-4 me-2" />
                              {t("تعديل", "Edit")}
                            </Link>
                          </DropdownMenuItem>
                          {status === "active" && <DropdownMenuItem onClick={() => act(l.id, "pause")}>{t("إيقاف مؤقت", "Pause")}</DropdownMenuItem>}
                          {(status === "paused" || status === "closed") && <DropdownMenuItem onClick={() => act(l.id, "resume")}>{t("إعادة التفعيل", "Resume")}</DropdownMenuItem>}
                          {status !== "closed" && status !== "rejected" && (
                            <DropdownMenuItem onClick={() => act(l.id, l.property_type === "rent" ? "rented" : "sold")}>
                              {l.property_type === "rent" ? t("تم التأجير", "Mark as rented") : t("تم البيع", "Mark as sold")}
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setConfirmDelete(l.id)}>
                            {t("حذف", "Delete")}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="font-bold">
                      {fmt(l.price)} {t("ج.م", "EGP")}
                      {l.property_type === "rent" && <span className="font-normal text-muted-foreground text-sm"> {t("/ شهرياً", "/month")}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground">{[l.area, `${l.size} ${t("م²", "m²")}`].filter(Boolean).join(" · ")}</div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
                      <StatusBadge lng={lng} status={status} />
                      <span className="flex items-center gap-1"><Eye className="w-3.5 h-3.5" />{fmt(l.views)}</span>
                      <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{fmt(l.whatsapp_clicks)}</span>
                      <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" />{fmt(l.call_clicks)}</span>
                    </div>
                    {status === "rejected" && l.rejection_reason && (
                      <div className="text-xs text-red-700 bg-red-50 rounded p-2 mt-1">
                        {t("سبب الرفض: ", "Reason: ")}
                        {l.rejection_reason}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent dir={lng === "ar" ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("حذف الإعلان؟", "Delete this listing?")}</AlertDialogTitle>
            <AlertDialogDescription>{t("سيتم حذف الإعلان وصوره نهائياً ولا يمكن استرجاعه.", "The listing and its photos are deleted permanently.")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("إلغاء", "Cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                if (confirmDelete) act(confirmDelete, "delete")
                setConfirmDelete(null)
              }}
            >
              {t("حذف", "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function StatusBadge({ lng, status }: { lng: string; status: Tab }) {
  const map: Record<Tab, [string, string, string]> = {
    active: ["نشط", "Live", "bg-green-100 text-green-800"],
    pending: ["قيد المراجعة", "In review", "bg-amber-100 text-amber-800"],
    rejected: ["مرفوض", "Rejected", "bg-red-100 text-red-800"],
    paused: ["موقوف", "Paused", "bg-slate-100 text-slate-700"],
    closed: ["مغلق", "Closed", "bg-blue-100 text-blue-800"],
  }
  const [ar, en, cls] = map[status]
  return <Badge className={`${cls} hover:${cls} border-0`}>{lng === "ar" ? ar : en}</Badge>
}
