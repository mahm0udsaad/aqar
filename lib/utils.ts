import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import type { Property, SearchFilters } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPrice(price: number): string {
  if (price >= 1000000) {
    return `${(price / 1000000).toFixed(1)}M`
  }
  if (price >= 1000) {
    return `${(price / 1000).toFixed(0)}K`
  }
  return price.toLocaleString()
}

export function formatPriceDetailed(price: number): string {
  return new Intl.NumberFormat("en-US").format(price)
}

export function formatArea(area: number): string {
  return new Intl.NumberFormat("en-US").format(area)
}

export function formatPropertyCount(count: number): string {
  return count === 1 ? "1 Property" : `${count} Properties`
}

export function formatPricePerMeter(price: number, size: number): number {
  return Math.round(price / size)
}

export function filterProperties(properties: Property[], filters: SearchFilters): Property[] {
  return properties.filter((property) => {
    if (filters.propertyType && property.propertyType !== filters.propertyType) {
      return false
    }

    if (filters.category && property.categoryId !== filters.category) {
      return false
    }

    if (filters.area && !property.area.toLowerCase().includes(filters.area.toLowerCase())) {
      return false
    }

    if (filters.minPrice && property.price < filters.minPrice) {
      return false
    }

    if (filters.maxPrice && property.price > filters.maxPrice) {
      return false
    }

    if (filters.minSize && property.size < filters.minSize) {
      return false
    }

    if (filters.maxSize && property.size > filters.maxSize) {
      return false
    }

    if (filters.bedrooms && property.bedrooms < filters.bedrooms) {
      return false
    }

    if (filters.bathrooms && property.bathrooms < filters.bathrooms) {
      return false
    }

    if (filters.ownerType && property.ownerType !== filters.ownerType) {
      return false
    }

    if (filters.isNew && !property.isNew) {
      return false
    }

    if (filters.amenities && filters.amenities.length > 0) {
      const hasAmenities = filters.amenities.some((amenity) =>
        property.amenities.some((propAmenity) => propAmenity.toLowerCase().includes(amenity.toLowerCase())),
      )
      if (!hasAmenities) return false
    }

    if (filters.query) {
      const query = filters.query.toLowerCase()
      return (
        property.title.toLowerCase().includes(query) ||
        property.description.toLowerCase().includes(query) ||
        property.location.toLowerCase().includes(query) ||
        property.area.toLowerCase().includes(query) ||
        property.features.some((feature) => feature.toLowerCase().includes(query))
      )
    }

    return true
  })
}

export function getFeaturedProperties(properties: Property[]): Property[] {
  return properties.filter((property) => property.isFeatured).sort((a, b) => b.views - a.views)
}

export function getRelatedProperties(properties: Property[], currentProperty: Property, limit = 4): Property[] {
  return properties
    .filter(
      (property) =>
        property.id !== currentProperty.id &&
        (property.categoryId === currentProperty.categoryId || property.area === currentProperty.area),
    )
    .sort((a, b) => b.views - a.views)
    .slice(0, limit)
}

export function getRatingColor(rating: number): string {
  if (rating >= 8) return "rating-excellent"
  if (rating >= 6) return "rating-good"
  if (rating >= 4) return "rating-average"
  return "rating-poor"
}

export function getTimeAgo(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))

  if (diffInHours < 24) {
    return `${diffInHours} hours ago`
  }

  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 30) {
    return `${diffInDays} days ago`
  }

  const diffInMonths = Math.floor(diffInDays / 30)
  return `${diffInMonths} months ago`
}
