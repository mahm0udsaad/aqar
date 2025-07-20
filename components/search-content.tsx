"use client"

import { useState, useEffect } from "react"
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
import { getProperties, searchProperties } from "@/lib/supabase/queries"
import type { Property } from "@/lib/types"

import type { PropertyWithDetails } from "@/lib/supabase/queries"

interface SearchContentProps {
  dict: any
  lng: Locale
  searchParams: { [key: string]: string | string[] | undefined }
  initialProperties: PropertyWithDetails[]
}

export function SearchContent({ dict, lng, searchParams, initialProperties }: SearchContentProps) {
  const router = useRouter()
  const urlSearchParams = useSearchParams()
  const [properties, setProperties] = useState<PropertyWithDetails[]>(initialProperties)
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  // Search state
  const [searchQuery, setSearchQuery] = useState((searchParams.q as string) || "")
  const [sortBy, setSortBy] = useState((searchParams.sort as string) || "newest")
  const [filters, setFilters] = useState({
    category: (searchParams.category as string) || "",
    minPrice: (searchParams.minPrice as string) || "",
    maxPrice: (searchParams.maxPrice as string) || "",
    location: (searchParams.location as string) || "",
    bedrooms: (searchParams.bedrooms as string) || "",
    bathrooms: (searchParams.bathrooms as string) || "",
    area: (searchParams.area as string) || "",
    type: (searchParams.type as string) || "",
  })

  // Load properties
  useEffect(() => {
    const loadProperties = async () => {
      setLoading(true)
      try {
        const searchFilters = {
          category: filters.category,
          minPrice: filters.minPrice ? Number.parseInt(filters.minPrice) : undefined,
          maxPrice: filters.maxPrice ? Number.parseInt(filters.maxPrice) : undefined,
          location: filters.location,
          bedrooms: filters.bedrooms ? Number.parseInt(filters.bedrooms) : undefined,
          bathrooms: filters.bathrooms ? Number.parseInt(filters.bathrooms) : undefined,
        }
        
        const data = searchQuery 
          ? await searchProperties(searchQuery, searchFilters)
          : await getProperties(searchFilters)

        setProperties(data || [])
      } catch (error) {
        console.error("Error loading properties:", error)
        setProperties([])
      } finally {
        setLoading(false)
      }
    }

    loadProperties()
  }, [searchQuery, filters, sortBy])

  // Update URL when filters change
  const updateURL = () => {
    const params = new URLSearchParams()
    if (searchQuery) params.set("q", searchQuery)
    if (sortBy !== "newest") params.set("sort", sortBy)
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.set(key, value)
    })

    const newURL = `/${lng}/search${params.toString() ? `?${params.toString()}` : ""}`
    router.push(newURL, { scroll: false })
  }

  const handleSearch = () => {
    updateURL()
  }

  const handleFilterChange = (newFilters: typeof filters) => {
    setFilters(newFilters)
  }

  const clearFilters = () => {
    setFilters({
      category: "",
      minPrice: "",
      maxPrice: "",
      location: "",
      bedrooms: "",
      bathrooms: "",
      area: "",
      type: "",
    })
    setSearchQuery("")
    setSortBy("newest")
  }

  const activeFiltersCount = Object.values(filters).filter(Boolean).length + (searchQuery ? 1 : 0)

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
              <Button onClick={handleSearch} className="px-6">
                {dict.nav.search}
              </Button>
              <Button variant="outline" onClick={() => setShowFilters(true)} className="lg:hidden">
                <Filter className="h-4 w-4 mr-2" />
                {dict.search.filters}
                {activeFiltersCount > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {activeFiltersCount}
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
            
              <SearchFilters dict={dict} lng={lng} filters={filters} onFiltersChange={handleFilterChange} />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          {/* Results Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {loading ? dict.search.searching : `${properties.length} ${dict.search.propertiesFound}`}
              </h2>
              {searchQuery && (
                <p className="text-muted-foreground">
                  {dict.search.searchResults}: &quot;{searchQuery}&quot;
                </p>
              )}
            </div>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder={dict.search.sortBy.label} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">{dict.search.sortBy.newest}</SelectItem>
                <SelectItem value="oldest">{dict.search.sortBy.oldest}</SelectItem>
                <SelectItem value="price-low">{dict.search.sortBy.priceLow}</SelectItem>
                <SelectItem value="price-high">{dict.search.sortBy.priceHigh}</SelectItem>
                <SelectItem value="area-large">{dict.search.sortBy.areaLarge}</SelectItem>
                <SelectItem value="area-small">{dict.search.sortBy.areaSmall}</SelectItem>
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
                    {dict.categories[filters.category] || filters.category}
                  </Badge>
                )}
                {filters.location && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {filters.location}
                  </Badge>
                )}
                {(filters.minPrice || filters.maxPrice) && (
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3" />
                    {filters.minPrice && filters.maxPrice
                      ? `${filters.minPrice} - ${filters.maxPrice}`
                      : filters.minPrice
                        ? `${dict.search.from} ${filters.minPrice}`
                        : `${dict.search.upTo} ${filters.maxPrice}`}
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
          {!loading && properties.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {properties.map((property) => (
                <PropertyCard key={property.id} property={property} dict={dict} lng={lng} />
              ))}
            </div>
          )}

          {/* Empty State */}
          {!loading && properties.length === 0 && (
            <Card className="p-12 text-center">
              <div className="space-y-4">
                <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                  <Search className="h-8 w-8 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">{dict.search.noResults}</h3>
                  <p className="text-muted-foreground mb-4">{dict.search.noResultsDescription}</p>
                  <Button onClick={clearFilters} variant="outline">
                    {dict.search.clearFilters}
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* Mobile Filters Sheet */}
      <SearchFiltersSheet
        open={showFilters}
        onOpenChange={setShowFilters}
        dict={dict}
        lng={lng}
        filters={filters}
        onFiltersChange={handleFilterChange}
        onApply={() => {
          setShowFilters(false)
          updateURL()
        }}
      />
    </div>
  )
}
