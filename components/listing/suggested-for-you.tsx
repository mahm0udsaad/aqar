"use client"

import { useEffect, useState } from "react"
import { PropertyCard } from "@/components/property-card"
import { fetchSuggestions } from "@/lib/actions/recommendations"
import { useAuth } from "@/lib/auth/auth-context"
import { tr } from "@/lib/listing-options"

export const RECENTLY_VIEWED_KEY = "aqar-recently-viewed"

export function rememberViewed(id: string) {
  try {
    const list: string[] = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]")
    const next = [id, ...list.filter((x) => x !== id)].slice(0, 20)
    localStorage.setItem(RECENTLY_VIEWED_KEY, JSON.stringify(next))
  } catch {}
}

/** Home page row ranked from what this visitor viewed and saved. Hidden until there is something to go on. */
export function SuggestedForYou({ lng }: { lng: string }) {
  const { loading, profile } = useAuth()
  const [items, setItems] = useState<any[]>([])

  useEffect(() => {
    if (loading) return
    let viewed: string[] = []
    try {
      viewed = JSON.parse(localStorage.getItem(RECENTLY_VIEWED_KEY) || "[]")
    } catch {}
    if (!viewed.length && !profile) return
    fetchSuggestions(viewed).then(setItems).catch(() => setItems([]))
  }, [loading, profile?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  if (!items.length) return null
  return (
    <section className="py-12 bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-1">{tr(lng, "مقترحة لك", "Suggested for you")}</h2>
        <p className="text-muted-foreground mb-6">{tr(lng, "بناءً على العقارات التي شاهدتها أو حفظتها", "Based on the properties you viewed or saved")}</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((p) => (
            <PropertyCard key={p.id} property={p} lng={lng as any} />
          ))}
        </div>
      </div>
    </section>
  )
}
