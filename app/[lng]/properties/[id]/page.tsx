import { notFound } from "next/navigation"
import { getPropertyWithLocale } from "@/lib/supabase/queries"
import { PropertyDetails } from "@/components/property-details"
import { Navbar } from "@/components/navbar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"

export async function generateMetadata({ params }: { params: { id: string; lng: Locale } }) {
  const { id, lng } = params;
  const dict = await getDictionary(lng);
  const property = await getPropertyWithLocale(id, lng);

  if (!property) {
    return {
      title: dict.seo.propertyNotFoundTitle,
      description: dict.seo.propertyNotFoundDescription,
    };
  }

  const title = property.meta_title || `${property.title} - ${property.location}, ${property.area}`;
  const description = property.meta_description || property.description.substring(0, 160);
  const imageUrl = property.thumbnail_url || property.property_images?.[0]?.url || '/placeholder.svg';

  return {
    title: title,
    description: description,
    openGraph: {
      title: title,
      description: description,
      images: [{
        url: imageUrl,
        width: 1200,
        height: 630,
        alt: property.title,
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
  const property = await getPropertyWithLocale(id, lng)

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
        <PropertyDetails property={property} lng={lng} />
      </div>
    </div>
  )
}
