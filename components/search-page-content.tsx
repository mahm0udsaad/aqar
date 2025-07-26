import { Navbar } from "@/components/navbar"
import { SearchServerContent } from "@/components/search-server-content"
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

interface SearchPageContentProps {
  dict: any
  lng: Locale
  searchParams: ServerSearchParams
  searchResult: SearchResult
  categories: Category[]
  areas: Area[]
  error?: string
}

export function SearchPageContent({ 
  dict, 
  lng, 
  searchParams, 
  searchResult, 
  categories, 
  areas, 
  error 
}: SearchPageContentProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{dict.search.title}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">{dict.search.subtitle}</p>
          </div>

          <SearchServerContent
            lng={lng}
            dict={dict}
            searchParams={searchParams}
            searchResult={searchResult}
            categories={categories}
            areas={areas}
            error={error}
          />
        </div>
      </main>
    </div>
  )
} 