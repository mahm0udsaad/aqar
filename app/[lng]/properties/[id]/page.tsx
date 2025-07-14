import { notFound } from "next/navigation"
import { getPropertyById } from "@/lib/supabase/queries"
import { PropertyDetails } from "@/components/property-details"
import { Navbar } from "@/components/navbar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

interface PropertyPageProps {
  params: Promise<{ id: string; lng: Locale }>
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id, lng } = await params
  const dict = await getDictionary(lng)
  const property = await getPropertyById(id)

  if (!property) {
    notFound()
  }

  const category = property.categories

  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center text-sm text-muted-foreground mb-6">
          <span>Home</span>
          <span className="mx-2">/</span>
          <span>{category?.name}</span>
          <span className="mx-2">/</span>
          <span>{property.area}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{property.title}</span>
        </div>
        <PropertyDetails property={property} />
      </div>
    </div>
  )
}
