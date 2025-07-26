import { SearchForm } from "@/components/search-form"
import { SearchFiltersServer } from "@/components/search-filters-server"
import { SearchResults } from "@/components/search-results"
import { SearchPagination } from "@/components/search-pagination"
import { Card, CardContent } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"
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

interface SearchServerContentProps {
  lng: Locale
  dict: any
  searchParams: ServerSearchParams
  searchResult: SearchResult
  categories: Category[]
  areas: Area[]
  error?: string
}

export function SearchServerContent({
  lng,
  dict,
  searchParams,
  searchResult,
  categories,
  areas,
  error
}: SearchServerContentProps) {
  if (error) {
    return (
      <div className="space-y-6">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <SearchForm lng={lng} dict={dict} searchParams={searchParams} />
        
        <Card className="p-12 text-center">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">{dict.search.errorTitle || "Something went wrong"}</h3>
              <p className="text-muted-foreground">{dict.search.errorDescription || "Please try again later"}</p>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Search Form */}
      <SearchForm lng={lng} dict={dict} searchParams={searchParams} />

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Filters */}
        <div className="hidden lg:block lg:col-span-1">
          <SearchFiltersServer
            lng={lng}
            dict={dict}
            searchParams={searchParams}
            categories={categories}
            areas={areas}
          />
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <SearchResults
            lng={lng}
            dict={dict}
            searchParams={searchParams}
            searchResult={searchResult}
            categories={categories}
            areas={areas}
          />

          {/* Pagination */}
          {searchResult.pagination.totalPages > 1 && (
            <div className="mt-8">
              <SearchPagination
                lng={lng}
                searchParams={searchParams}
                pagination={searchResult.pagination}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
} 