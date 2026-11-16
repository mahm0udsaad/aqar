import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { MyListings } from "@/components/account/my-listings"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getMyListings } from "@/lib/actions/listings"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

export default async function MyListingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lng: Locale }>
  searchParams: Promise<{ submitted?: string }>
}) {
  const { lng } = await params
  const { submitted } = await searchParams
  const data = await getMyListings()
  if (!data) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/listings`)}`)
  const dict = await getDictionary(lng)

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <MyListings lng={lng} listings={data.listings} limit={data.limit} used={data.used} justSubmitted={submitted === "1"} />
      </main>
    </div>
  )
}
