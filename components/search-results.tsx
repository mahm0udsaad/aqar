import { PropertyCard } from "@/components/property-card"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Search, MapPin, Home, DollarSign, X } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"
import type { PropertyWithDetails } from "@/lib/supabase/queries"
import { buildSearchUrl } from "@/lib/actions/search"
import Link from "next/link"

interface Area {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface SearchResult {
  properties: PropertyWithDetails[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

interface SearchResultsProps {
  lng: Locale
  dict: any
  searchParams: ServerSearchParams
  searchResult: SearchResult
  categories: Category[]
  areas: Area[]
}

export function SearchResults({
  lng,
  dict,
  searchParams,
  searchResult,
  categories,
  areas
}: SearchResultsProps) {
  const { properties, pagination } = searchResult

  // Helper function to build filter removal URLs
  const buildRemoveFilterUrl = (filterKey: keyof ServerSearchParams) => {
    const newParams = { ...searchParams }
    delete newParams[filterKey]
    delete newParams.page // Reset to first page
    return buildSearchUrl(lng, newParams)
  }

  // Build clear all URL
  const clearAllUrl = buildSearchUrl(lng, { 
    q: searchParams.q, 
    sort: searchParams.sort 
  })

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">
            {pagination.total} {dict.search.propertiesFound || "properties found"}
          </h2>
          {searchParams.q && (
            <p className="text-muted-foreground">
              {dict.search.searchResults || "Search results"}: &quot;{searchParams.q}&quot;
            </p>
          )}
          {pagination.page > 1 && (
            <p className="text-sm text-muted-foreground">
              {dict.search.page || "Page"} {pagination.page} {dict.search.of || "of"} {pagination.totalPages}
            </p>
          )}
        </div>
      </div>

      {/* Active Filters */}
      {Object.entries(searchParams).some(([key, value]) => {
        if (key === 'sort' || key === 'page' || key === 'limit') return false
        if (Array.isArray(value)) return value.length > 0
        return value !== undefined && value !== ""
      }) && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium">{dict.search.activeFilters || "Active Filters"}</h3>
            <Button variant="ghost" size="sm" asChild>
              <Link href={clearAllUrl}>
                <X className="h-4 w-4 mr-1" />
                {dict.search.clearAll || "Clear all"}
              </Link>
            </Button>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {searchParams.q && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Search className="h-3 w-3" />
                {searchParams.q}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('q')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {searchParams.type && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {searchParams.type === "sale" ? dict.search.forSale : dict.search.forRent}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('type')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {searchParams.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Home className="h-3 w-3" />
                {categories.find(c => c.id === searchParams.category)?.name || searchParams.category}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('category')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {searchParams.location && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <MapPin className="h-3 w-3" />
                {searchParams.location}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('location')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {(searchParams.minPrice || searchParams.maxPrice) && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <DollarSign className="h-3 w-3" />
                {searchParams.minPrice && searchParams.maxPrice
                  ? `${Number(searchParams.minPrice).toLocaleString()} - ${Number(searchParams.maxPrice).toLocaleString()}`
                  : searchParams.minPrice
                    ? `${dict.search.from || "From"} ${Number(searchParams.minPrice).toLocaleString()}`
                    : `${dict.search.upTo || "Up to"} ${Number(searchParams.maxPrice).toLocaleString()}`}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildSearchUrl(lng, { ...searchParams, minPrice: undefined, maxPrice: undefined, page: undefined })}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {searchParams.bedrooms && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {searchParams.bedrooms}+ {dict.search.bedrooms || "bedrooms"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('bedrooms')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
            
            {searchParams.bathrooms && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {searchParams.bathrooms}+ {dict.search.bathrooms || "bathrooms"}
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 ml-1"
                  asChild
                >
                  <Link href={buildRemoveFilterUrl('bathrooms')}>
                    <X className="h-3 w-3" />
                  </Link>
                </Button>
              </Badge>
            )}
          </div>
        </div>
      )}

      {/* Results Grid */}
      {properties.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {properties.map((property) => (
            <PropertyCard key={property.id} property={property} lng={lng} />
          ))}
        </div>
      ) : (
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Search className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{dict.search.noResults}</h3>
              <p className="text-muted-foreground mb-4">{dict.search.noResultsDescription}</p>
              <Button variant="outline" asChild>
                <Link href={clearAllUrl}>
                  {dict.search.clearFilters}
                </Link>
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
} 