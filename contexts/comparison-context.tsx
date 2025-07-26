"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"
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
  property_images?: { url: string; alt_text?: string }[]
  location_iframe_url?: string
}

interface ComparisonContextType {
  comparisonList: PropertyForComparison[]
  addToComparison: (property: PropertyForComparison) => void
  removeFromComparison: (propertyId: string) => void
  clearComparison: () => void
  isInComparison: (propertyId: string) => boolean
  count: number
  canAddMore: boolean
}

const MAX_COMPARISONS = 4
const STORAGE_KEY = "property-comparison"

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined)

export function ComparisonProvider({ children }: { children: ReactNode }) {
  const [comparisonList, setComparisonList] = useState<PropertyForComparison[]>([])
  const [isInitialized, setIsInitialized] = useState(false)

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
      setIsInitialized(true)
    }
  }, [])

  // Save to localStorage whenever list changes
  useEffect(() => {
    if (isInitialized && typeof window !== "undefined") {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comparisonList))
    }
  }, [comparisonList, isInitialized])

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

  const value = {
    comparisonList,
    addToComparison,
    removeFromComparison,
    clearComparison,
    isInComparison,
    count: comparisonList.length,
    canAddMore: comparisonList.length < MAX_COMPARISONS
  }

  return (
    <ComparisonContext.Provider value={value}>
      {children}
    </ComparisonContext.Provider>
  )
}

export function useComparison() {
  const context = useContext(ComparisonContext)
  if (context === undefined) {
    throw new Error("useComparison must be used within a ComparisonProvider")
  }
  return context
} 