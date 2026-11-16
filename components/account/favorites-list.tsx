"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "@/components/property-card"
import { getListingsByIds } from "@/lib/actions/listings"
import { useFavorites } from "@/contexts/favorites-context"
import { useAuth } from "@/lib/auth/auth-context"
import { tr } from "@/lib/listing-options"

export function FavoritesList({ lng }: { lng: string }) {
  const { profile, loading, openSignIn } = useAuth()
  const { ids, ready } = useFavorites()
  const [items, setItems] = useState<any[] | null>(null)
  const key = [...ids].sort().join(",")

  useEffect(() => {
    if (!ready) return
    let alive = true
    ;(async () => {
      const list = ids.size ? await getListingsByIds([...ids]) : []
      if (alive) setItems(list)
    })()
    return () => {
      alive = false
    }
  }, [key, ready]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!loading && !profile) {
    return (
      <div className="text-center py-16 space-y-4">
        <Heart className="w-10 h-10 mx-auto text-muted-foreground" />
        <h1 className="text-2xl font-bold">{tr(lng, "المفضلة", "Favorites")}</h1>
        <p className="text-muted-foreground">{tr(lng, "سجّل الدخول لتحفظ العقارات وترجع لها من أي جهاز.", "Sign in to save properties and find them on any device.")}</p>
        <Button onClick={() => openSignIn()}>{tr(lng, "تسجيل الدخول", "Sign in")}</Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl md:text-3xl font-bold">{tr(lng, "المفضلة", "Favorites")}</h1>
      {items === null ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-80 rounded-lg bg-muted animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 space-y-4">
          <Heart className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">{tr(lng, "لم تحفظ أي عقار بعد. اضغط على القلب في أي إعلان لحفظه هنا.", "No saved properties yet. Tap the heart on any listing to save it here.")}</p>
          <Link href={`/${lng}/search`}>
            <Button>{tr(lng, "تصفح العقارات", "Browse properties")}</Button>
          </Link>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} lng={lng as any} />
          ))}
        </div>
      )}
    </div>
  )
}
