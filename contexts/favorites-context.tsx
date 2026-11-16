"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getMyFavoriteIds, mergeFavorites, toggleFavorite } from "@/lib/actions/favorites"

const LEGACY_KEY = "lovedProperties"

interface FavoritesContextType {
  ids: Set<string>
  isFavorite: (id: string) => boolean
  /** Signed-in: saves to the account. Visitors: opens the sign-in popup. */
  toggle: (id: string) => Promise<void>
  ready: boolean
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { profile, loading, openSignIn } = useAuth()
  const [ids, setIds] = useState<Set<string>>(new Set())
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (loading) return
    if (!profile) {
      setIds(new Set())
      setReady(true)
      return
    }
    let alive = true
    ;(async () => {
      // Favorites saved in this browser before the account existed move into the account once
      let legacy: string[] = []
      try {
        legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || "[]")
      } catch {}
      const list = legacy.length ? await mergeFavorites(legacy) : await getMyFavoriteIds()
      if (legacy.length) {
        try {
          localStorage.removeItem(LEGACY_KEY)
        } catch {}
      }
      if (alive) {
        setIds(new Set(list))
        setReady(true)
      }
    })()
    return () => {
      alive = false
    }
  }, [profile?.id, loading]) // eslint-disable-line react-hooks/exhaustive-deps

  const toggle = useCallback(
    async (id: string) => {
      if (!profile) {
        openSignIn()
        return
      }
      const wasFav = ids.has(id)
      setIds((prev) => {
        const next = new Set(prev)
        wasFav ? next.delete(id) : next.add(id)
        return next
      })
      const res = await toggleFavorite(id)
      if (!res) {
        setIds((prev) => {
          const next = new Set(prev)
          wasFav ? next.add(id) : next.delete(id)
          return next
        })
        return
      }
      window.dispatchEvent(new CustomEvent("lovedPropertiesChanged", { detail: { propertyId: id, isLoved: res.favorite } }))
    },
    [profile, ids, openSignIn],
  )

  return (
    <FavoritesContext.Provider value={{ ids, isFavorite: (id) => ids.has(id), toggle, ready }}>
      {children}
    </FavoritesContext.Provider>
  )
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error("useFavorites must be used within FavoritesProvider")
  return ctx
}
