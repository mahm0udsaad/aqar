import { Navbar } from "@/components/navbar"
import { FavoritesList } from "@/components/account/favorites-list"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

export const metadata = { robots: { index: false } }

export default async function FavoritesPage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const dict = await getDictionary(lng)
  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-7xl mx-auto px-4 py-8">
        <FavoritesList lng={lng} />
      </main>
    </div>
  )
}
