import type { Metadata } from "next"
import { Navbar } from "@/components/navbar"
import { ListingWizard } from "@/components/listing/listing-wizard"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getCategories } from "@/lib/supabase/queries"
import { getLocations } from "@/lib/actions/locations"
import { getCurrentUser } from "@/lib/auth/session"
import { countActiveListings, getListingLimit } from "@/lib/auth/profiles"

export const dynamic = "force-dynamic"

export async function generateMetadata({ params }: { params: Promise<{ lng: Locale }> }): Promise<Metadata> {
  const { lng } = await params
  return {
    title: lng === "ar" ? "أضف عقارك مجاناً | عقار" : "List your property free | Aqar",
    robots: { index: false },
  }
}

export default async function NewListingPage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const [dict, categories, governorates, user] = await Promise.all([getDictionary(lng), getCategories(), getLocations(), getCurrentUser()])
  const limitInfo = user && user.account_type ? { used: await countActiveListings(user.id), limit: await getListingLimit(user) } : null

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="px-4 py-8">
        <ListingWizard lng={lng} categories={categories as any} governorates={governorates} limitInfo={limitInfo} />
      </main>
    </div>
  )
}
