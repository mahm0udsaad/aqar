import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { toast } from 'sonner'

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

interface ComparisonState {
  properties: PropertyForComparison[]
  addProperty: (property: PropertyForComparison) => void
  removeProperty: (propertyId: string) => void
  clearProperties: () => void
  isInComparison: (propertyId: string) => boolean
  count: () => number
  canAddMore: () => boolean
}

const MAX_COMPARISONS = 4

export const useComparisonStore = create<ComparisonState>()(
  persist(
    (set, get) => ({
      properties: [],
      
      addProperty: (property) => {
        const { properties } = get()
        
        // Check if already in comparison
        if (properties.some(p => p.id === property.id)) {
          toast.error("Property already in comparison")
          return
        }
        
        // Check max limit
        if (properties.length >= MAX_COMPARISONS) {
          toast.error(`Maximum ${MAX_COMPARISONS} properties can be compared`)
          return
        }
        
        set({ properties: [...properties, property] })
        toast.success("Property added to comparison")
      },
      
      removeProperty: (propertyId) => {
        const { properties } = get()
        set({ 
          properties: properties.filter(p => p.id !== propertyId) 
        })
        toast.success("Property removed from comparison")
      },
      
      clearProperties: () => {
        set({ properties: [] })
        toast.success("Comparison list cleared")
      },
      
      isInComparison: (propertyId) => {
        return get().properties.some(p => p.id === propertyId)
      },
      
      count: () => get().properties.length,
      
      canAddMore: () => get().properties.length < MAX_COMPARISONS
    }),
    {
      name: 'property-comparison-storage',
    }
  )
) 