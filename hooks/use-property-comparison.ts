"use client"

import { useState, useEffect } from "react"
import { toast } from "sonner"

export interface PropertyForComparison {
  id: string
  title: string
  price: number
  location: string
  area: string
  bedrooms: number
  bathrooms: number
  size: number
  property_type: "sale" | "rent"
  thumbnail_url?: string
}

const STORAGE_KEY = "property-comparison"
const MAX_COMPARISONS = 4

export function usePropertyComparison() {
  const [comparisonList, setComparisonList] = useState<PropertyForComparison[]>([])

  // Load from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        try {
          setComparisonList(JSON.parse(stored))
        } catch (error) {
          console.error("Error parsing comparison list from localStorage:", error)
        }
      }
    }
  }, [])

  // Save to localStorage whenever list changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList))
    }
  }, [comparisonList])

  const addToComparison = (property: PropertyForComparison) => {
    setComparisonList(current => {
      // Check if already in comparison
      if (current.find(p => p.id === property.id)) {
        toast.error("Property already in comparison")
        return current
      }

      // Check max limit
      if (current.length >= MAX_COMPARISONS) {
        toast.error(`Maximum ${MAX_COMPARISONS} properties can be compared`)
        return current
      }

      toast.success("Property added to comparison")
      return [...current, property]
    })
  }

  const removeFromComparison = (propertyId: string) => {
    setComparisonList(current => {
      const updated = current.filter(p => p.id !== propertyId)
      toast.success("Property removed from comparison")
      return updated
    })
  }

  const clearComparison = () => {
    setComparisonList([])
    toast.success("Comparison list cleared")
  }

  const isInComparison = (propertyId: string) => {
    return comparisonList.some(p => p.id === propertyId)
  }

  return {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    count: comparisonList.length,
    canAddMore: comparisonList.length < MAX_COMPARISONS
  }
} 