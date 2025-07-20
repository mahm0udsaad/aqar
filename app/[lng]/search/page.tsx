import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { Search } from "@/components/search"
import { getProperties, searchProperties } from "@/lib/supabase/queries"
import type { PropertyWithDetails } from "@/lib/supabase/queries"

interface SearchPageProps {
  params: { lng: Locale }
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const dict = await getDictionary(params.lng)

  const initialProperties = await (async () => {
    const { q, ...filters } = searchParams
    const searchFilters = {
      category: filters.category as string,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      location: filters.location as string,
      bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
      bathrooms: filters.bathrooms ? Number(filters.bathrooms) : undefined,
    }

    if (q) {
      return await searchProperties(q as string, searchFilters)
    }
    return await getProperties(searchFilters)
  })()

  return <Search dict={dict} lng={params.lng} searchParams={searchParams} initialProperties={initialProperties} />
}
