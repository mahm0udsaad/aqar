import { SearchFilterForm } from "@/components/search-filter-form"
import { Card, CardContent } from "@/components/ui/card"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"

interface Area {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface SearchFiltersServerProps {
  lng: Locale
  dict: any
  searchParams: ServerSearchParams
  categories: Category[]
  areas: Area[]
}

export function SearchFiltersServer({
  lng,
  dict,
  searchParams,
  categories,
  areas
}: SearchFiltersServerProps) {
  return (
    <Card id="filters">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold">{dict.search.filters}</h3>
        </div>
        
        <SearchFilterForm
          lng={lng}
          dict={dict}
          searchParams={searchParams}
          categories={categories}
          areas={areas}
        />
      </CardContent>
    </Card>
  )
} 