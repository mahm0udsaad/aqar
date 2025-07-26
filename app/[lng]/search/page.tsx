import { Suspense } from "react"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getCategories } from "@/lib/supabase/queries"
import { getAreas } from "@/lib/actions/areas"
import { serverSearchProperties, type ServerSearchParams } from "@/lib/actions/search"
import { SearchPageContent } from "@/components/search-page-content"
import { SearchPageSkeleton } from "@/components/search-page-skeleton"

interface SearchPageProps {
  params: Promise<{ lng: Locale }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const [resolvedParams, resolvedSearchParams] = await Promise.all([params, searchParams])
  
  // Convert searchParams to our expected format with proper type handling
  const serverSearchParams: ServerSearchParams = Object.entries(resolvedSearchParams).reduce((acc, [key, value]) => {
    if (value !== undefined) {
      // Handle the specific case where amenities can be an array
      if (key === 'amenities') {
        acc[key] = value as string | string[]
      } else {
        // For other params, take first value if it's an array
        acc[key as keyof ServerSearchParams] = Array.isArray(value) ? value[0] : value
      }
    }
    return acc
  }, {} as ServerSearchParams)

  return (
    <Suspense fallback={<SearchPageSkeleton />}>
      <SearchPageServer 
        lng={resolvedParams.lng} 
        searchParams={serverSearchParams}
      />
    </Suspense>
  )
}

async function SearchPageServer({ lng, searchParams }: { lng: Locale, searchParams: ServerSearchParams }) {
  try {
    // Fetch all data in parallel
    const [dict, categoriesData, areas, searchResult] = await Promise.all([
      getDictionary(lng),
      getCategories(),
      getAreas(),
      serverSearchProperties(searchParams)
    ])

    return (
      <SearchPageContent
        dict={dict}
        lng={lng}
        searchParams={searchParams}
        searchResult={searchResult}
        categories={categoriesData || []}
        areas={areas || []}
      />
    )
  } catch (error) {
    console.error("Error loading search page:", error)
    
    // Fallback: load minimal data if search fails
    const [dict, categoriesData, areas] = await Promise.all([
      getDictionary(lng),
      getCategories(),
      getAreas()
    ])

    const fallbackResult = {
      properties: [],
      pagination: {
        page: 1,
        limit: 24,
        total: 0,
        totalPages: 0,
        hasNextPage: false,
        hasPreviousPage: false
      }
    }

    return (
      <SearchPageContent
        dict={dict}
        lng={lng}
        searchParams={searchParams}
        searchResult={fallbackResult}
        categories={categoriesData || []}
        areas={areas || []}
        error="Failed to load search results"
      />
    )
  }
}
