"use client"

import React, { useState } from "react"
import { notFound } from "next/navigation"
import { PropertyCard } from "@/components/property-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  formatPriceDetailed,
  formatPricePerMeter,
} from "@/lib/utils"
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
} from "lucide-react"
import { PropertyGallery } from "@/components/property-gallery"
import { ShareModal } from "@/components/share-modal"
import { LoveButton } from "@/components/love-button"
import { PropertyComparisonButton } from "@/components/property-comparison-button"
import { PropertyWithDetails } from "@/lib/supabase/queries"
import { getProperties } from "@/lib/supabase/queries"
import { PropertyImage } from "@/lib/types"
import { AreaRatingsDisplay } from "@/components/area-ratings-display"

interface PropertyDetailsProps {
  property: PropertyWithDetails
  lng: string
}

export function PropertyDetails({ property, lng }: PropertyDetailsProps) {
  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const [relatedProperties, setRelatedProperties] = React.useState<
    PropertyWithDetails[]
  >([])

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

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Image Gallery */}
          <PropertyGallery
            images={property.property_images as unknown as PropertyImage[]}
            title={property.title}
          />

          {/* Property Info */}
          <Card>
            <CardContent className="p-6">
              {/* Price & Title */}
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  {property.is_new && (
                    <Badge className="new-badge text-white">New</Badge>
                  )}
                  {property.is_featured && (
                    <Badge className="featured-badge text-white">
                      Featured
                    </Badge>
                  )}
                  {property.is_verified && (
                    <Badge variant="secondary">
                      <Shield className="w-3 h-3 mr-1" />
                      Verified
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
                  {property.title}
                </h1>

                <div className="flex items-center text-gray-600 mb-4">
                  <MapPin className="w-5 h-5 mr-2" />
                  <span className="text-lg">
                    {property.location}, {property.area}
                  </span>
                </div>

                <div className="flex items-baseline gap-4">
                  <span className="text-4xl font-bold text-foreground">
                    {formatPriceDetailed(property.price)} EGP
                  </span>
                  {property.property_type === "rent" && (
                    <span className="text-lg text-muted-foreground">
                      /month
                    </span>
                  )}
                </div>
                <div className="text-muted-foreground mt-1">
                  {formatPriceDetailed(pricePerMeter)} EGP/m²
                </div>
              </div>

              {/* Property Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {property.bedrooms > 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bed className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="font-semibold">{property.bedrooms}</div>
                    <div className="text-sm text-muted-foreground">
                      Bedrooms
                    </div>
                  </div>
                )}
                {property.bathrooms > 0 && (
                  <div className="text-center p-4 bg-muted rounded-lg">
                    <Bath className="w-6 h-6 mx-auto mb-2 text-foreground" />
                    <div className="font-semibold">{property.bathrooms}</div>
                    <div className="text-sm text-muted-foreground">
                      Bathrooms
                    </div>
                  </div>
                )}
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Square className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <div className="font-semibold">{property.size}</div>
                  <div className="text-sm text-muted-foreground">m²</div>
                </div>
                <div className="text-center p-4 bg-muted rounded-lg">
                  <Eye className="w-6 h-6 mx-auto mb-2 text-foreground" />
                  <div className="font-semibold">{property.views}</div>
                  <div className="text-sm text-gray-600">Views</div>
                </div>
              </div>

              {/* Description */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-foreground leading-relaxed">
                  {property.description}
                </p>
              </div>

              {/* Property Details */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">
                  Property Details
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Property Type</span>
                    <span className="font-medium">{category?.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Listing Type</span>
                    <span className="font-medium capitalize">
                      {property.property_type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Owner Type</span>
                    <span className="font-medium capitalize">
                      {property.owner_type}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Floor</span>
                    <span className="font-medium">
                      {property.floor || "Ground"}
                    </span>
                  </div>
                  <div className="flex justify-between py-2 border-b">
                    <span className="text-muted-foreground">Year Built</span>
                    <span className="font-medium">
                      {property.year_built || "2020"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Features */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-3">
                  Features & Amenities
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {property.features?.map((feature: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center p-3 bg-muted rounded-lg"
                    >
                      <div className="w-2 h-2 bg-primary rounded-full mr-3"></div>
                      <span className="text-sm">{feature}</span>
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
                <CardTitle>Location</CardTitle>
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
          {/* Contact Agent */}
          <Card>
            <CardHeader>
              <CardTitle>Contact Owner</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-3">
                  <User className="w-8 h-8 text-foreground" />
                </div>
                <h3 className="font-semibold">{property.contact_name}</h3>
                <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                  <span className="capitalize">{property.owner_type}</span>
                  {property.contact_is_verified && (
                    <Shield className="w-3 h-3 text-green-500" />
                  )}
                </div>
                {property.response_time && (
                  <p className="text-xs text-gray-500 mt-1">
                    Responds within {property.response_time}
                  </p>
                )}
              </div>
              <Button size="lg" className="w-full">
                <Phone className="w-4 h-4 mr-2" /> Call Now
              </Button>
              <Button size="lg" variant="outline" className="w-full">
                <MessageCircle className="w-4 h-4 mr-2" /> Send Message
              </Button>
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-2">
                  <LoveButton propertyId={property.id} className="w-full" />
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setIsShareModalOpen(true)}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                </div>
                <PropertyComparisonButton 
                  property={{
                    id: property.id,
                    title: property.title,
                    price: property.price,
                    location: property.location,
                    area: property.area,
                    bedrooms: property.bedrooms,
                    bathrooms: property.bathrooms,
                    size: property.size,
                    property_type: property.property_type,
                    thumbnail_url: property.thumbnail_url
                  }}
                  size="lg"
                  lng={lng}
                />
              </div>
            </CardContent>
          </Card>

          {/* Related Properties */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Related Properties</h3>
            <div className="space-y-4">
              {relatedProperties.map((relatedProperty) => (
                <PropertyCard
                  key={relatedProperty.id}
                  property={relatedProperty}
                />
              ))}
            </div>
          </div>
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