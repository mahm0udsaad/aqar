"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { PropertyCard } from "@/components/property-card"
import { getListingsByIds } from "@/lib/actions/listings"
import { tr } from "@/lib/listing-options"

/** Favorites are kept in this browser (localStorage "lovedProperties"), as the heart button does. */
export function FavoritesList({ lng }: { lng: string }) {
  const [items, setItems] = useState<any[] | null>(null)

  useEffect(() => {
    const load = async () => {
      let ids: string[] = []
      try {
        ids = JSON.parse(localStorage.getItem("lovedProperties") || "[]")
      } catch {}
      setItems(ids.length ? await getListingsByIds(ids) : [])
    }
    load()
    window.addEventListener("lovedPropertiesChanged", load)
    return () => window.removeEventListener("lovedPropertiesChanged", load)
  }, [])

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
