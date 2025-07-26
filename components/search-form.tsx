"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Search, Filter, X } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"
import { buildSearchUrl, getActiveFiltersCount } from "@/lib/actions/search"

interface SearchFormProps {
  lng: Locale
  dict: any
  searchParams: ServerSearchParams
}

export function SearchForm({ lng, dict, searchParams }: SearchFormProps) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState(searchParams.q || "")
  const [sortBy, setSortBy] = useState(searchParams.sort || "newest")
  
  const activeFiltersCount = getActiveFiltersCount(searchParams)

  const handleSearch = () => {
    const newUrl = buildSearchUrl(lng, { 
      ...searchParams, 
      q: searchQuery.trim() || undefined,
      sort: sortBy !== "newest" ? sortBy : undefined,
      page: undefined // Reset to first page on new search
    })
    router.push(newUrl)
  }

  const handleSortChange = (newSort: string) => {
    setSortBy(newSort)
    const newUrl = buildSearchUrl(lng, { 
      ...searchParams, 
      sort: newSort !== "newest" ? newSort : undefined,
      page: undefined // Reset to first page on sort change
    })
    router.push(newUrl)
  }

  const clearAllFilters = () => {
    setSearchQuery("")
    setSortBy("newest")
    const newUrl = buildSearchUrl(lng, {})
    router.push(newUrl)
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col gap-4">
          {/* Main search row */}
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
              <div className="flex items-center gap-2 md:hidden">
                <Button variant="outline" asChild>
                  <a href="#filters">
                    <Filter className="h-4 w-4 mr-2" />
                    {dict.search.filters}
                    {activeFiltersCount > 0 && (
                      <Badge variant="secondary" className="ml-2">
                        {activeFiltersCount}
                      </Badge>
                    )}
                  </a>
                </Button>
              </div>
            </div>
          </div>

          {/* Sort and active filters row */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground whitespace-nowrap">
                {dict.search.sortBy?.label || "Sort by"}:
              </span>
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-48">
                  <SelectValue />
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

            {/* Active filters summary */}
            {activeFiltersCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {activeFiltersCount} {dict.search.activeFilters || "active filters"}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllFilters}
                  className="h-8 px-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  {dict.search.clearAll || "Clear all"}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 