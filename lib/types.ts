export type Locale = 'en' | 'ar'

export interface PropertyTranslation {
  id: string
  property_id: string
  locale: Locale
  title: string
  description?: string | null
  location?: string | null
  area?: string | null
  meta_title?: string | null
  meta_description?: string | null
  created_at: string
  updated_at: string
}

export interface Property {
  id: string
  title: string
  description: string
  price: number
  pricePerMeter?: number
  location: string
  area: string // City/District
  bedrooms: number
  bathrooms: number
  size: number // in sq meters
  floor?: number
  totalFloors?: number
  yearBuilt?: number
  categoryId: string
  propertyType: "sale" | "rent"
  images: PropertyImage[]
  videos?: PropertyVideo[]
  features: string[]
  amenities: string[]
  ownerType: "owner" | "broker"
  isNew: boolean
  isFeatured: boolean
  featuredOrder?: number
  heroFeatured?: boolean
  isVerified: boolean
  views: number
  contactInfo: ContactInfo
  location_coords?: {
    lat: number
    lng: number
  }
  seoKeywords?: string[]
  metaDescription?: string
  mapEnabled?: boolean
  ratings?: PropertyRatings
  createdAt: string
  updatedAt: string
}

export interface PropertyImage {
  id: string
  url: string
  alt: string
  caption?: string
  order: number
  isMain: boolean
}

export interface PropertyVideo {
  id: string
  url: string
  order: number
  createdAt: string
}

export interface ContactInfo {
  name: string
  phone: string
  whatsapp?: string
  email?: string
  avatar?: string
  isVerified: boolean
  responseTime?: string
}

export interface PropertyRatings {
  schools: number
  transportation: number
  shopping: number
  restaurants: number
  safety: number
  quietness: number
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  icon: string
  order: number
  isVisible?: boolean
  createdAt: string
  updatedAt: string
}

export interface SearchFilters {
  propertyType?: "sale" | "rent"
  category?: string
  area?: string
  minPrice?: number
  maxPrice?: number
  minSize?: number
  maxSize?: number
  bedrooms?: number
  bathrooms?: number
  ownerType?: "owner" | "broker"
  isNew?: boolean
  amenities?: string[]
  features?: string[]
  isFeatured?: boolean
  isVerified?: boolean
  location?: string
  minPricePerMeter?: number
  maxPricePerMeter?: number
  floor?: number
  yearBuilt?: number
  query?: string
}

export interface User {
  id: string
  name: string
  email: string
  phone?: string
  avatar?: string
  isVerified: boolean
  savedProperties: string[]
  createdAt: string
}
