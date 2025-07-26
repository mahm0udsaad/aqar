"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Filter, X } from "lucide-react"

import type { SearchFilters as SearchFiltersType } from "@/lib/types"

interface Area {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface SearchFiltersSheetProps {
  lng: string
  dict: any
  open: boolean
  onOpenChange: (open: boolean) => void
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  onApply: () => void
  categories: Category[]
  areas: Area[]
}

// Map area names to dictionary keys
const areaToKeyMap: Record<string, string> = {
  "New Cairo": "newCairo",
  "Maadi": "maadi",
  "Zamalek": "zamalek",
  "Heliopolis": "heliopolis",
  "6th of October": "sixthOfOctober",
  "Sheikh Zayed": "sheikhZayed",
  "New Capital": "newCapital",
  "Alexandria": "alexandria",
  "Giza": "giza",
  "Nasr City": "nasrCity",
}

// Map amenity names to dictionary keys
const amenityToKeyMap: Record<string, string> = {
  "Swimming Pool": "swimmingPool",
  "Gym": "gym",
  "Garden": "garden",
  "Parking": "parking",
  "Security": "security",
  "Elevator": "elevator",
  "Balcony": "balcony",
  "Central AC": "centralAC",
  "Kitchen Appliances": "kitchenAppliances",
  "Furnished": "furnished",
}

// Areas are now passed as props from the parent component

const amenities = [
  "Swimming Pool",
  "Gym",
  "Garden",
  "Parking",
  "Security",
  "Elevator",
  "Balcony",
  "Central AC",
  "Kitchen Appliances",
  "Furnished",
]

export function SearchFiltersSheet({ 
  lng, 
  dict, 
  open, 
  onOpenChange, 
  filters, 
  onFiltersChange, 
  onApply,
  categories,
  areas
}: SearchFiltersSheetProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 10000000])
  const [sizeRange, setSizeRange] = useState([filters.minSize || 50, filters.maxSize || 500])

  const updateFilter = (key: keyof SearchFiltersType, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = filters.amenities || []
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter((a) => a !== amenity)
      : [...currentAmenities, amenity]
    updateFilter("amenities", newAmenities)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    updateFilter("minPrice", values[0])
    updateFilter("maxPrice", values[1])
  }

  const handleSizeRangeChange = (values: number[]) => {
    setSizeRange(values)
    updateFilter("minSize", values[0])
    updateFilter("maxSize", values[1])
  }

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== ""
  })

  const handleApply = () => {
    onApply()
    onOpenChange(false)
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{dict.search.filters}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Property Type */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{dict.search.propertyType}</Label>
            <div className="flex gap-2">
              <Button
                variant={filters.propertyType === "sale" ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("propertyType", "sale")}
                className="flex-1"
              >
                {dict.search.forSale}
              </Button>
              <Button
                variant={filters.propertyType === "rent" ? "default" : "outline"}
                size="sm"
                onClick={() => updateFilter("propertyType", "rent")}
                className="flex-1"
              >
                {dict.search.forRent}
              </Button>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label className="text-sm font-medium">{dict.search.category}</Label>
            <Select
              value={filters.category || "all"}
              onValueChange={(value) => updateFilter("category", value === "all" ? undefined : value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={dict.search.allCategories} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.search.allCategories}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Area */}
          <div>
            <Label className="text-sm font-medium">{dict.search.area}</Label>
            <Select value={filters.area || "all"} onValueChange={(value) => updateFilter("area", value === "all" ? undefined : value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={dict.search.allAreas} />
              </SelectTrigger>
                          <SelectContent>
              <SelectItem value="all">{dict.search.allAreas}</SelectItem>
              {areas.map((area) => {
                const areaKey = areaToKeyMap[area.name] || area.slug
                return (
                  <SelectItem key={area.id} value={area.name}>
                    {dict.areas[areaKey as keyof typeof dict.areas] || area.name}
                  </SelectItem>
                )
              })}
            </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div>
            <Label className="text-sm font-medium">{dict.search.priceRangeEGP}</Label>
            <div className="mt-3 px-2">
              <Slider
                value={priceRange}
                onValueChange={handlePriceRangeChange}
                max={10000000}
                min={0}
                step={100000}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{(priceRange[0] / 1000000).toFixed(1)}M</span>
                <span>{(priceRange[1] / 1000000).toFixed(1)}M</span>
              </div>
            </div>
          </div>

          {/* Size Range */}
          <div>
            <Label className="text-sm font-medium">{dict.search.sizeRangeM2}</Label>
            <div className="mt-3 px-2">
              <Slider
                value={sizeRange}
                onValueChange={handleSizeRangeChange}
                max={500}
                min={50}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-500 mt-2">
                <span>{sizeRange[0]} {dict.property.squareMeter}</span>
                <span>{sizeRange[1]} {dict.property.squareMeter}</span>
              </div>
            </div>
          </div>

          {/* Bedrooms & Bathrooms */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium">{dict.search.bedrooms}</Label>
            <Select
                value={filters.bedrooms?.toString() || "any"}
                onValueChange={(value) => updateFilter("bedrooms", value === "any" ? undefined : Number(value))}
            >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={dict.general.any} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{dict.general.any}</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
                <SelectItem value="5">5+</SelectItem>
              </SelectContent>
            </Select>
          </div>
            <div>
              <Label className="text-sm font-medium">{dict.search.bathrooms}</Label>
            <Select
                value={filters.bathrooms?.toString() || "any"}
                onValueChange={(value) => updateFilter("bathrooms", value === "any" ? undefined : Number(value))}
            >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder={dict.general.any} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="any">{dict.general.any}</SelectItem>
                <SelectItem value="1">1+</SelectItem>
                <SelectItem value="2">2+</SelectItem>
                <SelectItem value="3">3+</SelectItem>
                <SelectItem value="4">4+</SelectItem>
              </SelectContent>
            </Select>
            </div>
          </div>

          {/* Owner Type */}
          <div>
            <Label className="text-sm font-medium">{dict.search.ownerType}</Label>
            <Select
              value={filters.ownerType || "all"}
              onValueChange={(value) => updateFilter("ownerType", value === "all" ? undefined : value as "owner" | "broker")}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder={dict.search.allOwners} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{dict.search.allOwners}</SelectItem>
                <SelectItem value="owner">{dict.search.owner}</SelectItem>
                <SelectItem value="broker">{dict.search.broker}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Amenities */}
          <div>
            <Label className="text-sm font-medium mb-3 block">{dict.search.amenities}</Label>
            <div className="grid grid-cols-2 gap-2">
              {amenities.map((amenity) => {
                const amenityKey = amenityToKeyMap[amenity]
                return (
                  <div key={amenity} className="flex items-center space-x-2">
                  <Checkbox
                      id={amenity}
                      checked={filters.amenities?.includes(amenity) || false}
                      onCheckedChange={(checked) => toggleAmenity(amenity)}
                    />
                    <Label htmlFor={amenity} className="text-sm">
                      {dict.amenities[amenityKey as keyof typeof dict.amenities] || amenity}
                  </Label>
                </div>
                )
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleApply} className="flex-1">
              {dict.search.applyFilters}
            </Button>
            {hasActiveFilters && (
              <Button variant="outline" onClick={() => onFiltersChange({})}>
                <X className="h-4 w-4 mr-2" />
                {dict.search.clear}
              </Button>
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}