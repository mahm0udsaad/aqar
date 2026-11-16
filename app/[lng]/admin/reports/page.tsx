import { AdminHeader } from "@/components/admin/admin-header"
import { ReportsList } from "@/components/admin/reports-list"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getReports } from "@/lib/actions/moderation"

export const dynamic = "force-dynamic"

export default async function ReportsPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const dict = await getDictionary(lng as "en" | "ar")
  const items = (await getReports("open")) || []
  return (
    <div>
      <AdminHeader
        title={lng === "ar" ? "بلاغات الزوار" : "Visitor reports"}
        description={lng === "ar" ? "إعلانات أبلغ عنها الزوار" : "Listings flagged by visitors"}
        lng={lng}
        dict={dict}
      />
      <div className="p-4 md:p-6">
        <ReportsList lng={lng} items={items} />
      </div>
    </div>
  )
}
