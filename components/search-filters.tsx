"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { SearchFilters as SearchFiltersType } from "@/lib/types"
import { categories } from "@/lib/data"
import { Filter, X, SlidersHorizontal } from "lucide-react"

interface SearchFiltersProps {
  filters: SearchFiltersType
  onFiltersChange: (filters: SearchFiltersType) => void
  onClearFilters: () => void
  isMobile?: boolean
}

const areas = [
  "New Cairo",
  "Maadi",
  "Zamalek",
  "Heliopolis",
  "6th of October",
  "Sheikh Zayed",
  "New Capital",
  "Alexandria",
  "Giza",
  "Nasr City",
]

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

export function SearchFilters({ filters, onFiltersChange, onClearFilters, isMobile = false, lng, dict }: SearchFiltersProps) {
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

  const FilterContent = () => (
    <div className="space-y-6">
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
          onValueChange={(value) => updateFilter("category", value || undefined)}
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
        <Select value={filters.area || "all"} onValueChange={(value) => updateFilter("area", value || undefined)}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder={dict.search.allAreas} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{dict.search.allAreas}</SelectItem>
            {areas.map((area) => (
              <SelectItem key={area} value={area}>
                {dict.areas[area as keyof typeof dict.areas]}
              </SelectItem>
            ))}
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
            onValueChange={(value) => updateFilter("bedrooms", value ? Number(value) : undefined)}
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
            onValueChange={(value) => updateFilter("bathrooms", value ? Number(value) : undefined)}
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
        <Label className="text-sm font-medium mb-3 block">{dict.search.ownerType}</Label>
        <div className="flex gap-2">
          <Button
            variant={filters.ownerType === "owner" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("ownerType", filters.ownerType === "owner" ? undefined : "owner")}
            className="flex-1"
          >
            {dict.search.owner}
          </Button>
          <Button
            variant={filters.ownerType === "broker" ? "default" : "outline"}
            size="sm"
            onClick={() => updateFilter("ownerType", filters.ownerType === "broker" ? undefined : "broker")}
            className="flex-1"
          >
            {dict.search.broker}
          </Button>
        </div>
      </div>

      {/* New Properties */}
      <div className="flex items-center space-x-2">
        <Checkbox
          id="isNew"
          checked={filters.isNew || false}
          onCheckedChange={(checked) => updateFilter("isNew", checked)}
        />
        <Label htmlFor="isNew" className="text-sm">
          {dict.search.newPropertiesOnly}
        </Label>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-sm font-medium mb-3 block">{dict.search.amenities}</Label>
        <div className="grid grid-cols-2 gap-2">
          {amenities.map((amenity) => (
            <div
              key={amenity}
              className={`flex items-center space-x-2 p-2 rounded border cursor-pointer transition-colors ${
                (filters.amenities || []).includes(amenity)
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-primary/50"
              }`}
              onClick={() => toggleAmenity(amenity)}
            >
              <Checkbox checked={(filters.amenities || []).includes(amenity)} readOnly />
              <span className="text-sm">{dict.amenities[amenity as keyof typeof dict.amenities]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">{dict.search.activeFilters}</Label>
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              {dict.search.clearAll}
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.propertyType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.propertyType === "sale" ? dict.search.forSale : dict.search.forRent}
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("propertyType", undefined)} />
              </Badge>
            )}
            {filters.category && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {categories.find((c) => c.id === filters.category)?.name}
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("category", undefined)} />
              </Badge>
            )}
            {filters.area && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {dict.areas[filters.area as keyof typeof dict.areas]}
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("area", undefined)} />
              </Badge>
            )}
            {(filters.amenities || []).map((amenity) => (
              <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                {dict.amenities[amenity as keyof typeof dict.amenities]}
                <X className="h-3 w-3 cursor-pointer" onClick={() => toggleAmenity(amenity)} />
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full bg-transparent">
            <SlidersHorizontal className="w-4 h-4 mr-2" />
            {dict.search.filters} {hasActiveFilters && `(${Object.keys(filters).length})`}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{dict.search.searchFilters}</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="bg-white rounded-lg border p-6 sticky top-4">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-semibold flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          {dict.search.filters}
        </h3>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={onClearFilters}>
            <X className="w-4 h-4 mr-1" />
            {dict.search.clear}
          </Button>
        )}
      </div>
      <FilterContent />
    </div>
  )
}
