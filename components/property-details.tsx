"use client"

import React, { useState } from "react"
import { notFound } from "next/navigation"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  formatPriceDetailed,
  formatPricePerMeter, assetUrl } from "@/lib/utils"
import {
  Phone,
  MessageCircle,
  MapPin,
  User,
  Shield,
  Eye,
  Bed,
  Bath,
  Square,
  Share2,
  ChevronLeft,
  ChevronRight,
  Play,
} from "lucide-react"
import { PropertyGallery } from "@/components/property-gallery"
import { ShareModal } from "@/components/share-modal"
import { LoveButton } from "@/components/love-button"
import { PropertyComparisonButton } from "@/components/property-comparison-button"
import type { PropertyWithDetails } from "@/lib/supabase/queries"
import type { Locale } from "@/lib/i18n/config"
import { fetchProperties as getProperties } from "@/lib/actions/public-data"
import { PropertyImage } from "@/lib/types"
import { AreaRatingsDisplay } from "@/components/area-ratings-display"
import { ContactCard } from "@/components/listing/contact-card"
import { FINISHING, PAYMENT_TYPES, categoryLabel, labelOf, tr } from "@/lib/listing-options"

interface PropertyDetailsProps {
  property: PropertyWithDetails
  lng: Locale
  /** false when the owner/admin previews a listing that is not public yet */
  isPublic?: boolean
}

export function PropertyDetails({ property, lng, isPublic = true }: PropertyDetailsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [relatedProperties, setRelatedProperties] = React.useState<
    PropertyWithDetails[]
  >([])

  const translateFeature = (feature: string) => {
    if (lng !== 'ar') return feature
    const map: Record<string, string> = {
      'Air Conditioning': 'تكييف هواء',
      'Balcony': 'شرفة',
      'Built-in Wardrobes': 'خزائن مدمجة',
      'Dishwasher': 'جلاية صحون',
      'Floorboards': 'أرضيات خشبية',
      'Gas Cooking': 'طهي بالغاز',
      'Internal Laundry': 'غسيل داخلي',
      'Pets Allowed': 'مسموح بالحيوانات الأليفة',
      'Parking': 'موقف سيارات',
      'Garden': 'حديقة',
      'Pool Access': 'وصول للمسبح',
      'Gym Access': 'وصول لصالة الألعاب',
    }
    return map[feature] || feature
  }

  React.useEffect(() => {
    async function fetchRelated() {
      if (property && property.categories) {
        const related = await getProperties({
          category: property.categories.id,
        })
        setRelatedProperties(
          related.filter((p) => p.id !== property.id).slice(0, 3),
        )
      }
    }
    fetchRelated()
  }, [property])

  if (!property) {
    notFound()
  }

  const category = property.categories
  const pricePerMeter =
    property.price && property.size
      ? formatPricePerMeter(property.price, property.size)
      : 0

  // Mock ratings data - will be replaced with actual data
  const ratings = property.property_ratings || {
    schools: 8.5,
    transportation: 7.2,
    shopping: 9.0,
    restaurants: 8.8,
    safety: 9.2,
    quietness: 6.5,
  }

  const displayTitle = lng === "ar"
    ? (property as any).title_ar || (property as any).title_en
    : (property as any).title_en || (property as any).title_ar
  const displayLocation = lng === "ar"
    ? (property as any).location_ar || (property as any).location_en || property.location
    : (property as any).location_en || (property as any).location_ar || property.location
  const displayDescription = lng === "ar"
    ? (property as any).description_ar || (property as any).description_en || property.description
    : (property as any).description_en || (property as any).description_ar || property.description

  const videos = (property as any).property_videos || []

  const nextVideo = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % videos.length)
  }

  const prevVideo = () => {
    setCurrentVideoIndex((prev) => (prev - 1 + videos.length) % videos.length)
  }

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <PropertyGallery
            images={property.property_images as unknown as PropertyImage[]}
            title={displayTitle}
          />

          {/* Videos Section */}
          {videos.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Play className="w-5 h-5" />
                  {lng === "ar" ? "الفيديوهات" : "Videos"}
                  {videos.length > 1 && (
                    <Badge variant="secondary" className="ml-2">
                      {currentVideoIndex + 1} / {videos.length}
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="relative">
                  {/* Main Video Display */}
                  <div className="relative group">
                    <video 
                      key={videos[currentVideoIndex].id}
                      src={assetUrl(videos[currentVideoIndex].url)} 
                      controls 
                      className="w-full h-[400px] object-cover rounded-lg border shadow-lg"
                      poster={assetUrl(videos[currentVideoIndex].thumbnail_url)}
                    />
                    
                    {/* Navigation Arrows - Only show if multiple videos */}
                    {videos.length > 1 && (
                      <>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={prevVideo}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/70 hover:bg-black/90 text-white border-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                          onClick={nextVideo}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                  </div>

                  {/* Video Caption */}
                  {videos[currentVideoIndex].caption && (
                    <div className="mt-4 p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground font-medium">
                        {videos[currentVideoIndex].caption}
                      </p>
                    </div>
                  )}

                  {/* Video Thumbnails - Only show if multiple videos */}
                  {videos.length > 1 && (
                    <div className="mt-6">
                      <div className="flex gap-3 overflow-x-auto pb-2">
                        {videos.map((video: any, index: number) => (
                          <button
                            key={video.id}
                            onClick={() => setCurrentVideoIndex(index)}
                            className={`relative flex-shrink-0 w-24 h-16 rounded-md overflow-hidden border-2 transition-all duration-200 ${
                              index === currentVideoIndex
                                ? 'border-primary shadow-md scale-105'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {video.thumbnail_url ? (
                              <img
                                src={assetUrl(video.thumbnail_url)}
                                alt={`Video ${index + 1}`}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-muted flex items-center justify-center">
                                <Play className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Play className="w-3 h-3 text-white" />
                            </div>
                            {index === currentVideoIndex && (
                              <div className="absolute inset-0 bg-primary/20" />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Property Info */}
          <Card>
            <CardContent className="p-6">
              {/* Price & Title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {property.is_new && (
                    <Badge className="new-badge text-white">{tr(lng, "جديد", "New")}</Badge>
                  )}
                  {property.is_featured && (
                    <Badge className="featured-badge text-white">
                      {tr(lng, "مميز", "Featured")}
                    </Badge>
                  )}
                  {property.is_verified && (
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      {tr(lng, "موثّق", "Verified")}
                    </Badge>
                  )}
                  {/* Action Buttons */}
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <LoveButton propertyId={property.id} size="sm" />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8 bg-white/90 hover:bg-white"
                      onClick={() => setIsShareModalOpen(true)}
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                  {displayTitle}
                </h1>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">
                    {displayLocation}, {property.area}
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPriceDetailed(property.price)} {tr(lng, "ج.م", "EGP")}
                  </span>
                  {property.property_type === "rent" && (
                    <span className="text-lg text-muted-foreground">
                      {tr(lng, "/ شهرياً", "/month")}
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-1">
                  {formatPriceDetailed(pricePerMeter)} {tr(lng, "ج.م/م²", "EGP/m²")}
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.bedrooms > 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">
                      {lng === "ar" ? "غرف النوم" : "Bedrooms"}
                    </div>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">
                      {lng === "ar" ? "الحمامات" : "Bathrooms"}
                    </div>
                  </div>
                )}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Square className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <div className="font-semibold">{property.size}</div>
                  <div className="text-sm text-muted-foreground">{lng === "ar" ? "م²" : "m²"}</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <div className="font-semibold">{property.views}</div>
                  <div className="text-sm text-gray-600">{lng === "ar" ? "المشاهدات" : "Views"}</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">{lng === "ar" ? "الوصف" : "Description"}</h2>
                <p className="text-foreground leading-relaxed">
                  {displayDescription}
                </p>
              </div>

              {/* Property Details */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">
                  {lng === "ar" ? "تفاصيل العقار" : "Property Details"}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{lng === "ar" ? "نوع العقار" : "Property Type"}</span>
                    <span className="font-medium">{categoryLabel(category as any, lng)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{lng === "ar" ? "نوع القائمة" : "Listing Type"}</span>
                    <span className="font-medium">
                      {property.property_type === "rent" ? tr(lng, "للإيجار", "For rent") : tr(lng, "للبيع", "For sale")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{lng === "ar" ? "نوع المالك" : "Owner Type"}</span>
                    <span className="font-medium">
                      {property.owner_type === "broker" ? tr(lng, "وسيط", "Broker") : tr(lng, "مالك", "Owner")}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">{lng === "ar" ? "الطابق" : "Floor"}</span>
                    <span className="font-medium">
                      {property.floor === 0 || property.floor == null ? tr(lng, "أرضي", "Ground") : property.floor}
                    </span>
                  </div>
                  {property.year_built ? (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{lng === "ar" ? "سنة البناء" : "Year Built"}</span>
                      <span className="font-medium">{property.year_built}</span>
                    </div>
                  ) : null}
                  {(property as any).finishing && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{tr(lng, "التشطيب", "Finishing")}</span>
                      <span className="font-medium">{labelOf(FINISHING, (property as any).finishing, lng)}</span>
                    </div>
                  )}
                  {(property as any).payment_type && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{tr(lng, "طريقة الدفع", "Payment")}</span>
                      <span className="font-medium">{labelOf(PAYMENT_TYPES, (property as any).payment_type, lng)}</span>
                    </div>
                  )}
                  {(property as any).down_payment != null && (property as any).payment_type !== "cash" && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{tr(lng, "المقدم", "Down payment")}</span>
                      <span className="font-medium">{formatPriceDetailed((property as any).down_payment)} {tr(lng, "ج.م", "EGP")}</span>
                    </div>
                  )}
                  {(property as any).installment_years != null && (property as any).payment_type !== "cash" && (
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-muted-foreground">{tr(lng, "مدة التقسيط", "Installment period")}</span>
                      <span className="font-medium">{tr(lng, `${(property as any).installment_years} سنوات`, `${(property as any).installment_years} years`)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">
                  {lng === "ar" ? "المميزات والمرافق" : "Features & Amenities"}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features?.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-muted rounded-lg"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span className="text-sm">{translateFeature(feature)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location Map */}
          {property.location_iframe_url && (
            <Card>
              <CardHeader>
                <CardTitle>{lng === "ar" ? "الموقع" : "Location"}</CardTitle>
              </CardHeader>
              <CardContent>
                <iframe
                  src={property.location_iframe_url}
                  width="100%"
                  height="450"
                  style={{ border: 0 }}
                  allowFullScreen={true}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                ></iframe>
              </CardContent>
            </Card>
          )}

          {/* Area Ratings */}
          {property.areas && (
            <AreaRatingsDisplay 
              areaId={property.areas.id}
              areaName={property.areas.name}
              showAddButton={true}
            />
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Contact */}
          <ContactCard
            lng={lng}
            propertyId={property.id}
            title={displayTitle}
            contactName={property.contact_name}
            contactPhone={property.contact_phone}
            contactWhatsapp={property.contact_whatsapp}
            ownerType={property.owner_type}
            owner={(property as any).user_profiles}
            trackable={isPublic}
          />
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <LoveButton propertyId={property.id} className="w-full" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {lng === "ar" ? "مشاركة" : "Share"}
                  </Button>
                </div > 
                <PropertyComparisonButton 
                  property={{
                    id: property.id,
                    title: displayTitle,
                    price: property.price,
                    location: displayLocation,
                    area: property.area,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    size: property.size,
                    property_type: property.property_type,
                    thumbnail_url: property.thumbnail_url ?? undefined,
                    property_images: (property as any).property_images,
                    location_iframe_url: property.location_iframe_url ?? undefined
                  }}
                  size="lg"
                  lng={lng}
                />
              </div>
            </CardContent>
          </Card>

          {/* Related Properties */}
          {relatedProperties.length > 0 && (
          <div>
            <h3 className="text-xl font-semibold mb-4">{lng === "ar" ? "عقارات ذات صلة" : "Related Properties"}</h3>
            <div className="space-y-4">
              {relatedProperties.map((relatedProperty) => (
                <PropertyCard
                  key={relatedProperty.id}
                  property={relatedProperty}
                  lng={lng}
                />
              ))}
            </div>
          </div>
          )}
        </div>
      </div>
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        property={property}
      />
    </>
  )
}