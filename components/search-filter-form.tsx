"use client"

import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { X } from "lucide-react"
import type { Locale } from "@/lib/i18n/config"
import type { ServerSearchParams } from "@/lib/actions/search"
import { buildSearchUrl } from "@/lib/actions/search"

interface Area {
  id: string
  name: string
  slug: string
}

interface Category {
  id: string
  name: string
}

interface SearchFilterFormProps {
  lng: Locale
  dict: any
  searchParams: ServerSearchParams
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

export function SearchFilterForm({
  lng,
  dict,
  searchParams,
  categories,
  areas
}: SearchFilterFormProps) {
  const router = useRouter()

  const updateFilter = (key: keyof ServerSearchParams, value: any) => {
    const newParams = { ...searchParams }
    
    if (value === undefined || value === null || value === "" || value === "all") {
      delete newParams[key]
    } else {
      newParams[key] = value
    }
    
    // Reset to first page when filters change
    delete newParams.page
    
    const newUrl = buildSearchUrl(lng, newParams)
    router.push(newUrl)
  }

  const toggleAmenity = (amenity: string) => {
    const currentAmenities = Array.isArray(searchParams.amenities) 
      ? searchParams.amenities 
      : searchParams.amenities 
        ? [searchParams.amenities]
        : []
    
    const newAmenities = currentAmenities.includes(amenity)
      ? currentAmenities.filter(a => a !== amenity)
      : [...currentAmenities, amenity]
    
    updateFilter("amenities", newAmenities.length > 0 ? newAmenities : undefined)
  }

  const clearAllFilters = () => {
    const newUrl = buildSearchUrl(lng, { q: searchParams.q, sort: searchParams.sort })
    router.push(newUrl)
  }

  const hasActiveFilters = Object.entries(searchParams).some(([key, value]) => {
    if (key === 'q' || key === 'sort' || key === 'page' || key === 'limit') return false
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== ""
  })

  const currentPriceRange = [
    searchParams.minPrice ? Number(searchParams.minPrice) : 0,
    searchParams.maxPrice ? Number(searchParams.maxPrice) : 10000000
  ]

  const currentSizeRange = [
    searchParams.minSize ? Number(searchParams.minSize) : 50,
    searchParams.maxSize ? Number(searchParams.maxSize) : 500
  ]

  const currentAmenities = Array.isArray(searchParams.amenities) 
    ? searchParams.amenities 
    : searchParams.amenities 
      ? [searchParams.amenities]
      : []

  return (
    <div className="space-y-6">
      {/* Property Type */}
      <div>
        <Label className="text-sm font-medium mb-3 block">{dict.search.propertyType}</Label>
        <div className="flex gap-2">
          <Button
            variant={searchParams.type === "sale" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("type", searchParams.type === "sale" ? undefined : "sale")}
            className="flex-1"
          >
            {dict.search.forSale}
          </Button>
          <Button
            variant={searchParams.type === "rent" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("type", searchParams.type === "rent" ? undefined : "rent")}
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
          value={searchParams.category || "all"}
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
        <Select 
          value={searchParams.location || "all"} 
          onValueChange={(value) => updateFilter("location", value === "all" ? undefined : value)}
        >
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
            value={currentPriceRange}
            onValueChange={(values) => {
              updateFilter("minPrice", values[0] > 0 ? values[0].toString() : undefined)
              updateFilter("maxPrice", values[1] < 10000000 ? values[1].toString() : undefined)
            }}
            max={10000000}
            min={0}
            step={100000}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{(currentPriceRange[0] / 1000000).toFixed(1)}M</span>
            <span>{(currentPriceRange[1] / 1000000).toFixed(1)}M</span>
          </div>
        </div>
      </div>

      {/* Size Range */}
      <div>
        <Label className="text-sm font-medium">{dict.search.sizeRangeM2}</Label>
        <div className="mt-3 px-2">
          <Slider
            value={currentSizeRange}
            onValueChange={(values) => {
              updateFilter("minSize", values[0] > 50 ? values[0].toString() : undefined)
              updateFilter("maxSize", values[1] < 500 ? values[1].toString() : undefined)
            }}
            max={500}
            min={50}
            step={10}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-gray-500 mt-2">
            <span>{currentSizeRange[0]} {dict.property.squareMeter}</span>
            <span>{currentSizeRange[1]} {dict.property.squareMeter}</span>
          </div>
        </div>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">{dict.search.bedrooms}</Label>
          <Select
            value={searchParams.bedrooms || "any"}
            onValueChange={(value) => updateFilter("bedrooms", value === "any" ? undefined : value)}
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
            value={searchParams.bathrooms || "any"}
            onValueChange={(value) => updateFilter("bathrooms", value === "any" ? undefined : value)}
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
          value={searchParams.ownerType || "all"}
          onValueChange={(value) => updateFilter("ownerType", value === "all" ? undefined : value)}
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

      {/* New Properties */}
      <div className="flex items-center gap-2">
        <Checkbox
          id="isNew"
          checked={searchParams.isNew === "true"}
          onCheckedChange={(checked) => updateFilter("isNew", checked ? "true" : undefined)}
        />
        <Label htmlFor="isNew" className="text-sm">
          {dict.search.newPropertiesOnly}
        </Label>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-sm font-medium mb-3 block">{dict.search.amenities}</Label>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map((amenity) => {
            const amenityKey = amenityToKeyMap[amenity]
            return (
              <div key={amenity} className="flex items-center gap-2">
                <Checkbox
                  id={amenity}
                  checked={currentAmenities.includes(amenity)}
                  onCheckedChange={() => toggleAmenity(amenity)}
                />
                <Label htmlFor={amenity} className="text-sm">
                  {dict.amenities[amenityKey as keyof typeof dict.amenities] || amenity}
                </Label>
              </div>
            )
          })}
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button onClick={clearAllFilters} variant="outline" className="w-full">
          <X className="h-4 w-4 mr-2" />
          {dict.search.clearFilters}
        </Button>
      )}
    </div>
  )
} 