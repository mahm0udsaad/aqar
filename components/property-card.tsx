"use client"

import Image from "next/image"
import Link from "next/link"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { PropertyWithDetails } from "@/lib/supabase/queries"
import {
  formatPrice,
  formatPriceDetailed,
  formatPricePerMeter,
} from "@/lib/utils"
import { LoveButton } from "@/components/love-button"
import { ShareModal } from "@/components/share-modal"
import {
  Bed,
  Bath,
  Square,
  MapPin,
  Share2,
  Phone,
  MessageCircle,
  Eye,
  Calendar,
  User,
  Shield,
} from "lucide-react"

interface PropertyCardProps {
  property: PropertyWithDetails
  showContactButtons?: boolean
  view?: "grid" | "list"
}

export function PropertyCard({
  property,
  showContactButtons = false,
}: PropertyCardProps) {
  if (!property) {
    return null // Don't render anything if no property is passed
  }

  const [isShareModalOpen, setIsShareModalOpen] = useState(false)
  const mainImage =
    property.property_images && property.property_images.length > 0
      ? property.property_images.find((img) => img.is_main) ||
        property.property_images[0]
      : null
  const pricePerMeter =
    property.price && property.size
      ? formatPricePerMeter(property.price, property.size)
      : null

  return (
    <Card className="property-card overflow-hidden group">
      <div className="relative">
        <Link href={`/properties/${property.id}`}>
          <div className="relative h-48 overflow-hidden">
            <Image
              src={mainImage?.url || "/placeholder.svg?height=300&width=400"}
              alt={mainImage?.alt_text || property.title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />

            {/* Image Count */}
            {property.property_images && property.property_images.length > 1 && (
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-xs">
                {property.property_images.length} photos
              </div>
            )}
          </div>
        </Link>

        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {property.is_new && (
            <Badge className="new-badge text-white text-xs">New</Badge>
          )}
          {property.is_featured && (
            <Badge className="featured-badge text-white text-xs">
              Featured
            </Badge>
          )}
          {property.is_verified && (
            <Badge className="verified-badge text-white text-xs">
              <Shield className="w-3 h-3 mr-1" />
              Verified
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="absolute top-2 right-2 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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

      <CardContent className="p-4">
        {/* Price */}
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-foreground">
              {property.price ? formatPriceDetailed(property.price) : "N/A"} EGP
            </span>
            {property.property_type === "rent" && (
              <span className="text-sm text-slate-500">/month</span>
            )}
          </div>
          {pricePerMeter && (
            <div className="text-sm text-slate-500">
              {formatPrice(pricePerMeter)} EGP/m²
            </div>
          )}
        </div>

        {/* Title & Location */}
        <Link href={`/properties/${property.id}`}>
          <h3 className="font-semibold text-lg mb-2 hover:text-primary transition-colors line-clamp-2">
            {property.title}
          </h3>
        </Link>

        <div className="flex items-center text-slate-600 mb-3">
          <MapPin className="w-4 h-4 mr-1" />
          <span className="text-sm">
            {property.location}, {property.area}
          </span>
        </div>

        {/* Property Details */}
        <div className="flex items-center justify-between text-sm text-slate-600 mb-4">
          <div className="flex items-center space-x-4">
            {property.bedrooms > 0 && (
              <div className="flex items-center">
                <Bed className="w-4 h-4 mr-1" />
                <span>{property.bedrooms}</span>
              </div>
            )}
            {property.bathrooms > 0 && (
              <div className="flex items-center">
                <Bath className="w-4 h-4 mr-1" />
                <span>{property.bathrooms}</span>
              </div>
            )}
            <div className="flex items-center">
              <Square className="w-4 h-4 mr-1" />
              <span>{property.size} m²</span>
            </div>
          </div>
        </div>

        {/* Owner Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-sm text-slate-600">
            <User className="w-4 h-4 mr-1" />
            <span className="capitalize">{property.owner_type}</span>
            {property.contact_is_verified && (
              <Shield className="w-3 h-3 ml-1 text-green-600" />
            )}
          </div>
          <div className="flex items-center text-sm text-slate-500">
            <Eye className="w-4 h-4 mr-1" />
            <span>{property.views}</span>
          </div>
        </div>

        {/* Contact Buttons */}
        {showContactButtons && (
          <div className="flex gap-2">
            {property.contact_phone && (
              <a
                href={`tel:${property.contact_phone}`}
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Phone className="w-4 h-4 mr-1" />
                  Call
                </Button>
              </a>
            )}
            {property.contact_whatsapp && (
              <a
                href={`https://wa.me/${property.contact_whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  size="sm"
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <MessageCircle className="w-4 h-4 mr-1" />
                  WhatsApp
                </Button>
              </a>
            )}
          </div>
        )}

        {/* Posted Date */}
        <div className="flex items-center text-xs text-slate-500 mt-2">
          <Calendar className="w-3 h-3 mr-1" />
          <span>
            Posted{" "}
            {new Date(property.created_at || Date.now()).toLocaleDateString()}
          </span>
        </div>
      </CardContent>

      {/* Share Modal */}
      <ShareModal
        property={property}
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />
    </Card>
  )
}
