import { AdminHeader } from "@/components/admin/admin-header"
import { ModerationQueue } from "@/components/admin/moderation-queue"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { getModerationQueue } from "@/lib/actions/moderation"

export const dynamic = "force-dynamic"

export default async function ModerationPage({ params }: { params: Promise<{ lng: string }> }) {
  const { lng } = await params
  const dict = await getDictionary(lng as "en" | "ar")
  const items = (await getModerationQueue()) || []
  return (
    <div>
      <AdminHeader
        title={lng === "ar" ? "مراجعة الإعلانات" : "Review queue"}
        description={lng === "ar" ? "إعلانات المستخدمين الجديدة والمعدّلة قبل ظهورها للزوار" : "New and edited user listings before they go live"}
        lng={lng}
        dict={dict}
      />
      <div className="p-4 md:p-6">
        <ModerationQueue lng={lng} items={items} />
      </div>
    </div>
  )
}
