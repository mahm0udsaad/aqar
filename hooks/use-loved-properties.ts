"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth/auth-context"
import { getLikedProperties, toggleLikedProperty, isPropertyLiked } from "@/lib/supabase/queries"
import type { PropertyWithCategory } from "@/lib/supabase/queries"

export function useLovedProperties() {
  const { user } = useAuth()
  const [lovedProperties, setLovedProperties] = useState<PropertyWithCategory[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadLovedProperties()
    } else {
      setLovedProperties([])
    }
  }, [user])

  const loadLovedProperties = async () => {
    if (!user) return

    setLoading(true)
    try {
      const properties = await getLikedProperties(user.id)
      setLovedProperties(properties)
    } catch (error) {
      console.error("Error loading loved properties:", error)
    } finally {
      setLoading(false)
    }
  }

  const toggleLoved = async (propertyId: string) => {
    if (!user) return false

    try {
      const isLiked = await toggleLikedProperty(user.id, propertyId)
      await loadLovedProperties() // Refresh the list
      return isLiked
    } catch (error) {
      console.error("Error toggling loved property:", error)
      return false
    }
  }

  const isLoved = async (propertyId: string) => {
    if (!user) return false

    try {
      return await isPropertyLiked(user.id, propertyId)
    } catch (error) {
      console.error("Error checking if property is loved:", error)
      return false
    }
  }

  return {
    lovedProperties,
    loading,
    toggleLoved,
    isLoved,
    refresh: loadLovedProperties,
  }
}
