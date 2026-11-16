"use client"

import Link from "next/link"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import { ArrowLeft, ArrowRight, Eye, Heart, MessageCircle, MessagesSquare, Phone, TrendingDown, TrendingUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { ListingAnalytics } from "@/lib/actions/analytics"
import { tr } from "@/lib/listing-options"

/** Chart colors: categorical slots 1 and 2 of the reference palette, stepped for light and dark. */
const VIZ_STYLE = `
.viz-root { --series-1: #2a78d6; --series-2: #eb6834; --grid: #e7e5e0; --axis: #6b6a66; }
.dark .viz-root { --series-1: #3987e5; --series-2: #d95926; --grid: #2e2e2c; --axis: #a3a29b; }
`

function Tile({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="w-4 h-4" />
          {label}
        </div>
        <div className="text-2xl font-bold mt-1">{value}</div>
        {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
      </CardContent>
    </Card>
  )
}

export function ListingStats({ lng, data }: { lng: string; data: ListingAnalytics }) {
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const nf = (n: number) => Number(n || 0).toLocaleString(lng === "ar" ? "ar-EG" : "en-US")
  const Back = lng === "ar" ? ArrowRight : ArrowLeft
  const contactsTotal = data.totals.whatsapp + data.totals.calls + data.totals.conversations
  const rate = data.last30.views ? Math.round((data.last30.contacts / data.last30.views) * 1000) / 10 : 0
  const dayLabel = (d: string) => new Date(d + "T00:00:00").toLocaleDateString(lng === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short" })
  const series = data.daily.map((d) => ({ ...d, label: dayLabel(d.date) }))
  const axisProps = { tick: { fill: "var(--axis)", fontSize: 11 }, tickLine: false, axisLine: false } as const
  const tooltipStyle = {
    contentStyle: { background: "hsl(var(--background))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 },
    labelStyle: { color: "hsl(var(--foreground))", fontWeight: 600 },
    itemStyle: { color: "hsl(var(--foreground))" },
  }

  return (
    <div className="space-y-6 viz-root">
      <style>{VIZ_STYLE}</style>
      <div>
        <Link href={`/${lng}/account/listings`} className="text-sm text-muted-foreground inline-flex items-center gap-1 hover:underline">
          <Back className="w-4 h-4" />
          {t("إعلاناتي", "My listings")}
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold mt-2">{t("إحصائيات الإعلان", "Listing stats")}</h1>
        <Link href={`/${lng}/properties/${data.id}`} className="text-muted-foreground hover:underline">
          {data.title}
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <Tile icon={Eye} label={t("المشاهدات", "Views")} value={nf(data.totals.views)} sub={t(`${nf(data.last30.views)} آخر 30 يوماً`, `${nf(data.last30.views)} in last 30 days`)} />
        <Tile icon={MessageCircle} label={t("واتساب", "WhatsApp")} value={nf(data.totals.whatsapp)} />
        <Tile icon={Phone} label={t("اتصال وإظهار الرقم", "Calls & number reveals")} value={nf(data.totals.calls)} />
        <Tile icon={MessagesSquare} label={t("محادثات", "Conversations")} value={nf(data.totals.conversations)} />
        <Tile icon={Heart} label={t("حفظوه في المفضلة", "Saved by")} value={nf(data.totals.favorites)} />
      </div>

      <Card>
        <CardContent className="p-4 text-sm">
          {data.last30.views > 0
            ? t(
                `من كل 100 زائر خلال آخر 30 يوماً، تواصل معك ${rate}. إجمالي التواصل منذ النشر: ${nf(contactsTotal)}.`,
                `Of every 100 visitors in the last 30 days, ${rate} contacted you. Total contacts since publishing: ${nf(contactsTotal)}.`,
              )
            : t("لا توجد مشاهدات خلال آخر 30 يوماً بعد.", "No views in the last 30 days yet.")}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("المشاهدات اليومية (آخر 30 يوماً)", "Daily views (last 30 days)")}</CardTitle>
        </CardHeader>
        <CardContent className="h-64 px-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip {...tooltipStyle} formatter={(v: number) => [nf(v), t("مشاهدة", "views")]} />
              <Area type="monotone" dataKey="views" stroke="var(--series-1)" strokeWidth={2} fill="var(--series-1)" fillOpacity={0.12} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("مرات التواصل اليومية: واتساب واتصال ورسائل", "Daily contacts: WhatsApp, calls and messages")}</CardTitle>
        </CardHeader>
        <CardContent className="h-56 px-2" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={series} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} stroke="var(--grid)" />
              <XAxis dataKey="label" {...axisProps} interval="preserveStartEnd" minTickGap={24} />
              <YAxis {...axisProps} allowDecimals={false} width={32} />
              <Tooltip {...tooltipStyle} cursor={{ fill: "var(--grid)", opacity: 0.5 }} formatter={(v: number) => [nf(v), t("تواصل", "contacts")]} />
              <Bar dataKey="contacts" fill="var(--series-2)" radius={[4, 4, 0, 0]} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">{t("سعر المتر مقارنة بالمنطقة", "Price per m² vs. the area")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>
            {t("سعر المتر في إعلانك: ", "Your price per m²: ")}
            <b>{nf(data.market.ppm)} {t("ج.م", "EGP")}</b>
          </div>
          {data.market.medianPpm ? (
            <>
              <div>
                {t(`متوسط ${nf(data.market.comparables)} إعلانات مشابهة في نفس المنطقة: `, `Median of ${nf(data.market.comparables)} similar listings in the same area: `)}
                <b>{nf(data.market.medianPpm)} {t("ج.م", "EGP")}</b>
              </div>
              <div className="flex items-center gap-1">
                {(data.market.diffPct ?? 0) > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                {Math.abs(data.market.diffPct ?? 0) <= 5
                  ? t("سعرك قريب من متوسط المنطقة.", "Your price is close to the area median.")
                  : (data.market.diffPct ?? 0) > 0
                    ? t(`أعلى من المتوسط بـ ${nf(data.market.diffPct!)}٪`, `${data.market.diffPct}% above the median`)
                    : t(`أقل من المتوسط بـ ${nf(Math.abs(data.market.diffPct!))}٪`, `${Math.abs(data.market.diffPct!)}% below the median`)}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">{t("لا توجد إعلانات مشابهة كافية في المنطقة للمقارنة بعد.", "Not enough similar listings in the area to compare yet.")}</div>
          )}
        </CardContent>
      </Card>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground">{t("عرض الأرقام كجدول", "Show the numbers as a table")}</summary>
        <table className="w-full mt-2 text-sm">
          <thead>
            <tr className="text-muted-foreground">
              <th className="text-start py-1">{t("اليوم", "Day")}</th>
              <th className="text-start py-1">{t("المشاهدات", "Views")}</th>
              <th className="text-start py-1">{t("التواصل", "Contacts")}</th>
            </tr>
          </thead>
          <tbody>
            {[...series].reverse().map((d) => (
              <tr key={d.date} className="border-t">
                <td className="py-1">{d.label}</td>
                <td className="py-1">{nf(d.views)}</td>
                <td className="py-1">{nf(d.contacts)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </div>
  )
}
