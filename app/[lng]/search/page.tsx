import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { Search } from "@/components/search"

interface SearchPageProps {
  params: Promise<{ lng: Locale }>
  searchParams: { [key: string]: string | string[] | undefined }
}

export default async function SearchPage({ params, searchParams }: SearchPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return <Search dict={dict} lng={lng} searchParams={searchParams} />
}
