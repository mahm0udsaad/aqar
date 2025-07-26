import { searchProperties, getProperties } from "@/lib/supabase/queries"
import type { SearchFilters } from "@/lib/supabase/queries"

export interface ServerSearchParams {
  q?: string
  category?: string
  minPrice?: string
  maxPrice?: string
  location?: string
  bedrooms?: string
  bathrooms?: string
  minSize?: string
  maxSize?: string
  type?: string
  ownerType?: string
  isNew?: string
  amenities?: string | string[]
  sort?: string
  page?: string
  limit?: string
}

export function parseSearchParams(searchParams: ServerSearchParams): {
  filters: SearchFilters
  query: string
  sort: string
  page: number
  limit: number
} {
  const filters: SearchFilters = {
    category: searchParams.category || undefined,
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    location: searchParams.location || undefined,
    bedrooms: searchParams.bedrooms ? Number(searchParams.bedrooms) : undefined,
    bathrooms: searchParams.bathrooms ? Number(searchParams.bathrooms) : undefined,
    minSize: searchParams.minSize ? Number(searchParams.minSize) : undefined,
    maxSize: searchParams.maxSize ? Number(searchParams.maxSize) : undefined,
    propertyType: (searchParams.type as "sale" | "rent") || undefined,
    ownerType: (searchParams.ownerType as "owner" | "broker") || undefined,
    isNew: searchParams.isNew === "true" ? true : undefined,
    amenities: Array.isArray(searchParams.amenities) 
      ? searchParams.amenities 
      : searchParams.amenities 
        ? [searchParams.amenities] 
        : undefined,
  }

  const query = searchParams.q || ""
  const sort = searchParams.sort || "newest"
  const page = searchParams.page ? Number(searchParams.page) : 1
  const limit = searchParams.limit ? Number(searchParams.limit) : 24

  return { filters, query, sort, page, limit }
}

export async function serverSearchProperties(searchParams: ServerSearchParams) {
  try {
    const { filters, query, sort, page, limit } = parseSearchParams(searchParams)
    
    // Get properties from database
    let properties = query.trim() !== ""
      ? await searchProperties(query, filters)
      : await getProperties(filters)

    // Apply server-side sorting
    properties = sortProperties(properties, sort)

    // Apply pagination
    const total = properties.length
    const startIndex = (page - 1) * limit
    const endIndex = startIndex + limit
    const paginatedProperties = properties.slice(startIndex, endIndex)

    return {
      properties: paginatedProperties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: endIndex < total,
        hasPreviousPage: page > 1
      }
    }
  } catch (error) {
    console.error("Error in server search:", error)
    throw new Error("Failed to search properties")
  }
}

function sortProperties(properties: any[], sortBy: string) {
  const sorted = [...properties]
  
  switch (sortBy) {
    case "oldest":
      return sorted.reverse()
    case "price-low":
      return sorted.sort((a, b) => (a.price || 0) - (b.price || 0))
    case "price-high":
      return sorted.sort((a, b) => (b.price || 0) - (a.price || 0))
    case "area-large":
      return sorted.sort((a, b) => (b.size || 0) - (a.size || 0))
    case "area-small":
      return sorted.sort((a, b) => (a.size || 0) - (b.size || 0))
    case "price-per-meter-low":
      return sorted.sort((a, b) => (a.price_per_meter || 0) - (b.price_per_meter || 0))
    case "price-per-meter-high":
      return sorted.sort((a, b) => (b.price_per_meter || 0) - (a.price_per_meter || 0))
    case "newest":
    default:
      return sorted
  }
}

export function buildSearchUrl(
  lng: string, 
  newParams: Partial<ServerSearchParams>, 
  currentParams?: ServerSearchParams
): string {
  const params = new URLSearchParams()
  
  // Merge current params with new params
  const finalParams = { ...currentParams, ...newParams }
  
  // Only add params that have values
  Object.entries(finalParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (Array.isArray(value)) {
        value.forEach(v => params.append(key, v))
      } else {
        params.set(key, String(value))
      }
    }
  })
  
  const queryString = params.toString()
  return `/${lng}/search${queryString ? `?${queryString}` : ''}`
}

export function getActiveFiltersCount(searchParams: ServerSearchParams): number {
  let count = 0
  
  if (searchParams.q && searchParams.q.trim() !== '') count++
  if (searchParams.category) count++
  if (searchParams.minPrice || searchParams.maxPrice) count++
  if (searchParams.location) count++
  if (searchParams.bedrooms) count++
  if (searchParams.bathrooms) count++
  if (searchParams.minSize || searchParams.maxSize) count++
  if (searchParams.type) count++
  if (searchParams.ownerType) count++
  if (searchParams.isNew === 'true') count++
  if (searchParams.amenities) {
    count += Array.isArray(searchParams.amenities) ? searchParams.amenities.length : 1
  }
  
  return count
} 