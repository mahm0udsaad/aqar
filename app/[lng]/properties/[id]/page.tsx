import { assetUrl } from "@/lib/utils"
import { notFound } from "next/navigation"
import { getPropertyById } from "@/lib/supabase/queries"
import { PropertyDetails } from "@/components/property-details"
import { Navbar } from "@/components/navbar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { Locale } from "@/lib/i18n/config"
import { getCurrentUser } from "@/lib/auth/session"
import { ListingStatusBanner } from "@/components/listing/listing-status-banner"
import { getSimilarListings } from "@/lib/recommendations"

export async function generateMetadata({ params }: { params: Promise<{ id: string; lng: Locale }> }) {
  const { id, lng } = await params;
  const dict = await getDictionary(lng);
  const property = await getPropertyById(id);

  if (!property) {
    const viewer = await getCurrentUser()
    if (viewer) {
      const draft = await getPropertyById(id, { includeUnpublished: true })
      if (draft && (viewer.role === "admin" || (draft as any).owner_id === viewer.id)) {
        return {
          title: `${lng === "ar" ? "معاينة" : "Preview"}: ${(draft as any).title_ar || (draft as any).title_en || draft.title}`,
          robots: { index: false, follow: false },
        }
      }
    }
    return {
      title: dict.seo.propertyNotFoundTitle,
      description: dict.seo.propertyNotFoundDescription,
    };
  }

  const localizedTitle = lng === "ar"
    ? ((property as any).title_ar || (property as any).title_en)
    : ((property as any).title_en || (property as any).title_ar)
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
  const imageUrl = assetUrl(property.thumbnail_url || property.property_images?.[0]?.url || '/placeholder.svg');

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
      url: `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/properties/${id}`,
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
  let property = await getPropertyById(id)
  let isPublic = true

  // Owners and admins can preview a listing that is under review, paused or rejected
  if (!property) {
    const viewer = await getCurrentUser()
    if (viewer) {
      const draft = await getPropertyById(id, { includeUnpublished: true })
      if (draft && (viewer.role === "admin" || (draft as any).owner_id === viewer.id)) {
        property = draft
        isPublic = false
      }
    }
  }

  if (!property) {
    notFound()
  }

  const category = property.categories
  const similar = await getSimilarListings(property.id, 4)

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
          <span className="text-foreground">{(lng === "ar" ? (property as any).title_ar : (property as any).title_en)}</span>
        </div>
        {!isPublic && (
          <ListingStatusBanner
            lng={lng}
            id={property.id}
            status={property.status as string}
            moderationStatus={(property as any).moderation_status}
            rejectionReason={(property as any).rejection_reason}
          />
        )}
        <PropertyDetails property={property} lng={lng} isPublic={isPublic} similar={similar} />
      </div>
    </div>
  )
}
