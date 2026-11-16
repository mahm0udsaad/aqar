import "server-only"
import { searchProperties, getProperties } from "@/lib/supabase/queries"
import { parseSearchParams, type ServerSearchParams } from "@/lib/search-params"

export type { ServerSearchParams } from "@/lib/search-params"
export { parseSearchParams, buildSearchUrl, getActiveFiltersCount } from "@/lib/search-params"

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

