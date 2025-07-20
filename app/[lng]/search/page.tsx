import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { Search } from "@/components/search"
import { getProperties, searchProperties } from "@/lib/supabase/queries"
import type { PropertyWithDetails } from "@/lib/supabase/queries"

interface SearchPageProps {
  params: Promise<{ lng: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams])
  const dict = await getDictionary(resolvedParams.lng)

  let initialProperties: PropertyWithDetails[] = []
  
  try {
    const { q, ...filters } = resolvedSearchParams
    const searchFilters = {
      category: filters.category as string,
      minPrice: filters.minPrice ? Number(filters.minPrice) : undefined,
      maxPrice: filters.maxPrice ? Number(filters.maxPrice) : undefined,
      location: filters.location as string,
      bedrooms: filters.bedrooms ? Number(filters.bedrooms) : undefined,
      bathrooms: filters.bathrooms ? Number(filters.bathrooms) : undefined,
    }

    if (q) {
      initialProperties = await searchProperties(q as string, searchFilters)
    } else {
      initialProperties = await getProperties(searchFilters)
    }
  } catch (error) {
    console.error("Error loading initial properties:", error)
    initialProperties = []
  }

  return <Search dict={dict} lng={resolvedParams.lng} searchParams={resolvedSearchParams} initialProperties={initialProperties} />
}
