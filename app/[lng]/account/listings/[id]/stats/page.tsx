import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ListingStats } from "@/components/account/listing-stats"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getListingAnalytics } from "@/lib/actions/analytics"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

export default async function ListingStatsPage({ params }: { params: Promise<{ lng: Locale; id: string }> }) {
  const { lng, id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/listings/${id}/stats`)}`)
  const data = await getListingAnalytics(id)
  if (!data) notFound()
  const dict = await getDictionary(lng)
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ListingStats lng={lng} data={data} />
      </main>
    </div>
  )
}
