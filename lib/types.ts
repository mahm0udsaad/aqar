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
  features: string[]
  amenities: string[]
  ownerType: "owner" | "broker"
  isNew: boolean
  isFeatured: boolean
  isVerified: boolean
  views: number
  contactInfo: ContactInfo
  location_coords?: {
    lat: number
    lng: number
  }
  ratings?: PropertyRatings
  createdAt: string
  updatedAt: string
}

export interface PropertyImage {
  id: string
  url: string
  alt: string
  order: number
  isMain: boolean
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
