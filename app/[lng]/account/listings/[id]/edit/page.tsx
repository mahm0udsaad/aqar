import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ListingWizard, type WizardInitial } from "@/components/listing/listing-wizard"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getCategories } from "@/lib/supabase/queries"
import { getLocations } from "@/lib/actions/locations"
import { getMyListingForEdit } from "@/lib/actions/listings"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

const str = (v: unknown) => (v === null || v === undefined ? "" : String(v))

export default async function EditListingPage({ params }: { params: Promise<{ lng: Locale; id: string }> }) {
  const { lng, id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/listings/${id}/edit`)}`)

  const data = await getMyListingForEdit(id)
  if (!data) notFound()
  const p = data.property

  // location_id points at a city (child) or directly at a governorate
  const governorateId = p.location_level === "governorate" ? p.location_id : p.location_parent_id || ""
  const cityId = p.location_level === "city" ? p.location_id : ""
  const initial: WizardInitial = {
    id: p.id,
    propertyType: p.property_type,
    categoryId: str(p.category_id),
    governorateId: str(governorateId),
    cityId: str(cityId),
    areaText: cityId ? "" : str(p.area),
    address: str(p.location),
    price: str(p.price),
    size: str(p.size),
    floor: str(p.floor),
    totalFloors: str(p.total_floors),
    bedrooms: str(p.bedrooms),
    bathrooms: str(p.bathrooms),
    finishing: str(p.finishing),
    paymentType: str(p.payment_type),
    downPayment: str(p.down_payment),
    installmentYears: str(p.installment_years),
    title: str(p.title_ar || p.title_en || p.title),
    description: str(p.description_ar || p.description_en || p.description),
    images: data.images,
  }

  const [dict, categories, governorates] = await Promise.all([getDictionary(lng), getCategories(), getLocations()])
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="px-4 py-8">
        <ListingWizard lng={lng} categories={categories as any} governorates={governorates} initial={initial} />
      </main>
    </div>
  )
}
