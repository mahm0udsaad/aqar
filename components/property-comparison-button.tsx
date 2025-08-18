"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Plus, Minus, GitCompare } from "lucide-react"
import { useComparison, PropertyForComparison } from "@/contexts/comparison-context"
import Link from "next/link"

interface PropertyComparisonButtonProps {
  property: {
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
    property_images?: { url: string; alt_text?: string }[] // Add this field
  }
  size?: "sm" | "lg" | "default"
  lng: string
}

export function PropertyComparisonButton({ property, size = "sm", lng }: PropertyComparisonButtonProps) {
  const { addToComparison, removeFromComparison, isInComparison, count, canAddMore } = useComparison()

  const isAdded = isInComparison(property.id)

  const handleToggle = () => {
    const comparisonProperty: PropertyForComparison = {
      id: property.id,
      title: property.title,
      price: property.price,
      location: property.location,
      area: property.area,
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      size: property.size,
      property_type: property.property_type,
      thumbnail_url: property.thumbnail_url,
      property_images: property.property_images, // Pass the property_images
    }

    if (isAdded) {
      removeFromComparison(property.id)
    } else {
      addToComparison(comparisonProperty)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isAdded ? "default" : "outline"}
              size={size}
              onClick={handleToggle}
              disabled={!isAdded && !canAddMore}
              className={`transition-all ${
                isAdded 
                  ? "bg-blue-600 text-white hover:bg-blue-700" 
                  : "hover:bg-blue-50 hover:border-blue-300"
              }`}
            >
              {isAdded ? (
                <Minus className="w-4 h-4" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              <span className="ml-2 hidden sm:inline">
                {isAdded ? "Remove" : "Compare"}
              </span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            {isAdded 
              ? "Remove from comparison" 
              : canAddMore 
                ? "Add to comparison" 
                : "Maximum properties reached"
            }
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Comparison counter badge */}
      {count > 0 && (
        <Link href={`/${lng}/compare`}>
          <Badge 
            variant="secondary" 
            className="bg-blue-100 text-blue-800 hover:bg-blue-200 cursor-pointer transition-colors"
          >
            <GitCompare className="w-3 h-3 mr-1" />
            {count}
          </Badge>
        </Link>
      )}
    </div>
  )
}