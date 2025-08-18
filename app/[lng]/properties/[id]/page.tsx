import { notFound } from "next/navigation"
import { getPropertyById } from "@/lib/supabase/queries"
import { PropertyDetails } from "@/components/property-details"
import { Navbar } from "@/components/navbar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

export async function generateMetadata({ params }: { params: { id: string; lng: Locale } }) {
  const { id, lng } = params;
  const dict = await getDictionary(lng);
  const property = await getPropertyById(id);

  if (!property) {
    return {
      title: dict.seo.propertyNotFoundTitle,
      description: dict.seo.propertyNotFoundDescription,
    };
  }

  const localizedTitle = lng === "ar"
    ? ((property as any).title_ar || (property as any).title_en || property.title)
    : ((property as any).title_en || (property as any).title_ar || property.title)
  const localizedLocation = lng === "ar"
    ? ((property as any).location_ar || (property as any).location_en || property.location)
    : ((property as any).location_en || (property as any).location_ar || property.location)
  const localizedDescription = lng === "ar"
    ? ((property as any).description_ar || (property as any).description_en || property.description)
    : ((property as any).description_en || (property as any).description_ar || property.description)

  const title = `${localizedTitle} - ${localizedLocation}, ${property.area}`;
  const description = localizedDescription.substring(0, 160);
  const keywords = [
    localizedTitle,
    localizedLocation,
    property.area,
    (property.categories as any)?.name || (property.categories as any)?.name_en || (property.categories as any)?.name_ar,
    property.property_type === "rent" ? (lng === "ar" ? "إيجار" : "rent") : (lng === "ar" ? "بيع" : "sale"),
    "Egypt",
    "real estate",
  ]
    .filter(Boolean)
    .join(", ");
  const imageUrl = property.thumbnail_url || property.property_images?.[0]?.url || '/placeholder.svg';

  return {
    title: title,
    description: description,
    keywords,
    openGraph: {
      title: title,
      description: description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: localizedTitle,
      }],
      type: 'website',
      locale: lng,
      url: `/${lng}/properties/${id}`,
    },
    twitter: {
      card: 'summary_large_image',
      title: title,
      description: description,
      images: [imageUrl],
    },
  };
}

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
          <span>{lng === "ar" ? "الصفحة الرئيسية" : "Home"}</span>
          <span className="mx-2">/</span>
          <span>{lng === "ar" ? (category as any)?.name_ar || category?.name : (category as any)?.name_en || category?.name}</span>
          <span className="mx-2">/</span>
          <span>{property.area}</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{(lng === "ar" ? (property as any).title_ar : (property as any).title_en) || property.title}</span>
        </div>
        <PropertyDetails property={property} lng={lng} />
      </div>
    </div>
  )
}
