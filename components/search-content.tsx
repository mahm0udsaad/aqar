"use client"

import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { SearchFilters } from "@/components/search-filters"
import { PropertyCard } from "@/components/property-card"
import { SearchFiltersSheet } from "@/components/search-filters-sheet"
import { Search, Filter, SlidersHorizontal, MapPin, Home, DollarSign } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import { getProperties, searchProperties, getCategories } from "@/lib/supabase/queries"
import { getAreas } from "@/lib/actions/areas"
import type { Property } from "@/lib/types"
import type { SearchFilters as SearchFiltersType } from "@/lib/types"

import type { PropertyWithDetails } from "@/lib/supabase/queries"

interface Area {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface SearchContentProps {
  dict: any
  lng: Locale
  searchParams: { [key: string]: string | string[] | undefined }
  initialProperties: PropertyWithDetails[]
  categories: Category[]
  areas: Area[]
}

export function SearchContent({ dict, lng, searchParams, initialProperties, categories, areas }: SearchContentProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [properties, setProperties] = useState<PropertyWithDetails[]>(initialProperties)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const loadingRef = useRef(false) // Prevent concurrent requests

  // Search state
  const [searchQuery, setSearchQuery] = useState(searchParams?.q ? String(searchParams.q) : "")
  const [sortBy, setSortBy] = useState(searchParams?.sort ? String(searchParams.sort) : "newest")
  
  // Memoize the initial filters to prevent infinite re-renders
  const initialFilters = useMemo(() => ({
    category: searchParams?.category ? String(searchParams.category) : undefined,
    minPrice: searchParams?.minPrice ? Number.parseInt(String(searchParams.minPrice)) : undefined,
    maxPrice: searchParams?.maxPrice ? Number.parseInt(String(searchParams.maxPrice)) : undefined,
    area: searchParams?.location ? String(searchParams.location) : undefined,
    bedrooms: searchParams?.bedrooms ? Number.parseInt(String(searchParams.bedrooms)) : undefined,
    bathrooms: searchParams?.bathrooms ? Number.parseInt(String(searchParams.bathrooms)) : undefined,
    minSize: searchParams?.area ? Number.parseInt(String(searchParams.area)) : undefined,
    propertyType: searchParams?.type ? String(searchParams.type) as "sale" | "rent" : undefined,
  }), [searchParams])
  
  const [filters, setFilters] = useState<SearchFiltersType>(initialFilters)

  // Load properties function with proper error handling
  const loadProperties = useCallback(async (query: string, currentFilters: SearchFiltersType) => {
    // Prevent concurrent requests
    if (loadingRef.current) {
      console.log("Request already in progress, skipping...")
      return
    }

    loadingRef.current = true
    setLoading(true)
    
    try {
      console.log("Loading properties with query:", query, "and filters:", currentFilters)
      
      const searchFilters = {
        category: currentFilters.category,
        minPrice: currentFilters.minPrice,
        maxPrice: currentFilters.maxPrice,
        location: currentFilters.area, // Map area to location for supabase queries
        bedrooms: currentFilters.bedrooms,
        bathrooms: currentFilters.bathrooms,
        propertyType: currentFilters.propertyType,
        minSize: currentFilters.minSize,
        maxSize: currentFilters.maxSize,
        amenities: currentFilters.amenities,
        features: currentFilters.features,
        ownerType: currentFilters.ownerType,
        isNew: currentFilters.isNew,
        isFeatured: currentFilters.isFeatured,
        isVerified: currentFilters.isVerified,
      }
      
      const data = query && query.trim() !== ""
        ? await searchProperties(query, searchFilters)
        : await getProperties(searchFilters)

      console.log("Properties loaded successfully:", data?.length || 0)
      setProperties(data || [])
    } catch (error) {
      console.error("Error loading properties:", error)
      setProperties([])
    } finally {
      setLoading(false)
      loadingRef.current = false
    }
  }, [])

  // Update URL when filters change
  const updateURL = useCallback(() => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (sortBy !== "newest") params.set("sort", sortBy)
    
    // Convert filters back to strings for URL
    if (filters.category) params.set("category", filters.category)
    if (filters.minPrice) params.set("minPrice", filters.minPrice.toString())
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice.toString())
    if (filters.area) params.set("location", filters.area)
    if (filters.bedrooms) params.set("bedrooms", filters.bedrooms.toString())
    if (filters.bathrooms) params.set("bathrooms", filters.bathrooms.toString())
    if (filters.minSize) params.set("area", filters.minSize.toString())
    if (filters.propertyType) params.set("type", filters.propertyType)

    const newURL = `/${lng}/search${params.toString() ? `?${params.toString()}` : ""}`
    router.push(newURL, { scroll: false })
  }, [searchQuery, sortBy, filters, lng, router])

  const handleSearch = async () => {
    await loadProperties(searchQuery, filters)
    updateURL()
  }

  const handleFilterChange = (newFilters: SearchFiltersType) => {
    console.log("Filter changed:", newFilters)
    setFilters(newFilters)
  }

  const handleApplyFilters = async () => {
    await loadProperties(searchQuery, filters)
    updateURL()
  }

  const clearFilters = async () => {
    const clearedFilters = {}
    setFilters(clearedFilters)
    setSearchQuery("")
    setSortBy("newest")
    // Reload properties with cleared filters
    await loadProperties("", clearedFilters)
    // Update URL after clearing
    const params = new URLSearchParams()
    const newURL = `/${lng}/search`
    router.push(newURL, { scroll: false })
  }

  // Sort properties based on sortBy value
  const sortedProperties = useMemo(() => {
    if (!properties.length) return []
    
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
      case "newest":
      default:
        return sorted
    }
  }, [properties, sortBy])

  // Calculate active filters count more robustly
  const filterCount = Object.values(filters).reduce((count, value) => {
    if (Array.isArray(value)) return count + (value.length > 0 ? 1 : 0)
    return count + (value !== undefined && value !== "" ? 1 : 0)
  }, 0)
  
  const searchCount = searchQuery && typeof searchQuery === 'string' && searchQuery.trim() !== '' ? 1 : 0
  const activeFiltersCount = filterCount + searchCount

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder={dict.search.searchPlaceholder}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`${lng === "ar" ? "pr-10 pl-4" : "pl-10 pr-4"}`}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleSearch} className="px-6" disabled={loading}>
                {loading ? "Searching..." : dict.nav.search}
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)} className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                {dict.search.filters}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {String(activeFiltersCount)}
                  </Badge>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <SearchFilters 
            dict={dict} 
            lng={lng} 
            filters={filters} 
            onFiltersChange={handleFilterChange}
            onClearFilters={clearFilters}
            categories={categories}
            areas={areas}
          />
          <Button onClick={handleApplyFilters} className="w-full mt-4" disabled={loading}>
            {loading ? "Applying..." : (dict.search.applyFilters || "Apply Filters")}
          </Button>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {loading ? (dict.search.searching || "Searching...") : `${sortedProperties.length} ${dict.search.propertiesFound || "properties found"}`}
              </h2>
              {searchQuery && (
                <p className="text-muted-foreground">
                  {dict.search.searchResults || "Search results"}: &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy} disabled={loading}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={dict.search.sortBy?.label || "Sort by"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{dict.search.sortBy?.newest || "Newest"}</SelectItem>
                <SelectItem value="oldest">{dict.search.sortBy?.oldest || "Oldest"}</SelectItem>
                <SelectItem value="price-low">{dict.search.sortBy?.priceLow || "Price: Low to High"}</SelectItem>
                <SelectItem value="price-high">{dict.search.sortBy?.priceHigh || "Price: High to Low"}</SelectItem>
                <SelectItem value="area-large">{dict.search.sortBy?.areaLarge || "Area: Large to Small"}</SelectItem>
                <SelectItem value="area-small">{dict.search.sortBy?.areaSmall || "Area: Small to Large"}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Active Filters */}
          {activeFiltersCount > 0 && (
            <div className="mb-6">
              <div className="flex flex-wrap gap-2">
                {searchQuery && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Search className="h-3 w-3" />
                    {searchQuery}
                  </Badge>
                )}
                {filters.category && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Home className="h-3 w-3" />
                    {dict.categories?.[filters.category] || filters.category}
                  </Badge>
                )}
                {filters.area && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {filters.area}
                  </Badge>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {filters.minPrice && filters.maxPrice
                      ? `${filters.minPrice} - ${filters.maxPrice}`
                      : filters.minPrice
                        ? `${dict.search.from || "From"} ${filters.minPrice}`
                        : `${dict.search.upTo || "Up to"} ${filters.maxPrice}`}
                  </Badge>
                )}
              </div>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardContent className="p-4 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Results Grid */}
          {!loading && sortedProperties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {sortedProperties.map((property) => (
                <PropertyCard key={property.id} property={property} lng={lng} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && sortedProperties.length === 0 && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{dict.search.noResults}</h3>
                  <p className="text-muted-foreground mb-4">{dict.search.noResultsDescription}</p>
                  {(activeFiltersCount > 0 || searchQuery) && (
                    <Button onClick={clearFilters} variant="outline" disabled={loading}>
                      {dict.search.clearFilters}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Filters Sheet */}
                <SearchFiltersSheet
            lng={lng}
            dict={dict}
            open={showFilters}
            onOpenChange={setShowFilters}
            filters={filters}
            onFiltersChange={handleFilterChange}
            onApply={handleApplyFilters}
            categories={categories}
            areas={areas}
          />
    </div>
  )
}