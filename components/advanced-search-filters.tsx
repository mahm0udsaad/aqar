"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import type { SearchFilters as SearchFiltersType } from "@/lib/types"
import { categories } from "@/lib/data"
import { Search, Filter, X, MapPin, Home, Car, Wifi, Dumbbell, Shield, Trees } from "lucide-react"

interface AdvancedSearchFiltersProps {
  filters: SearchFiltersType & {
    propertyType?: string
    yearBuilt?: number
    parking?: boolean
    furnished?: boolean
    petFriendly?: boolean
    amenities?: string[]
  }
  onFiltersChange: (filters: any) => void
  onClearFilters: () => void
  isMobile?: boolean
  dict?: any
}

const amenitiesList = [
  { id: "parking", label: "Parking", icon: Car },
  { id: "wifi", label: "High-Speed Internet", icon: Wifi },
  { id: "gym", label: "Gym/Fitness Center", icon: Dumbbell },
  { id: "security", label: "24/7 Security", icon: Shield },
  { id: "garden", label: "Garden/Outdoor Space", icon: Trees },
  { id: "pool", label: "Swimming Pool", icon: Home },
]

const propertyTypes = [
  { value: "sale", label: "For Sale" },
  { value: "rent", label: "For Rent" },
]

export function AdvancedSearchFilters({
  filters,
  onFiltersChange,
  onClearFilters,
  isMobile = false,
  dict,
}: AdvancedSearchFiltersProps) {
  const [priceRange, setPriceRange] = useState([filters.minPrice || 0, filters.maxPrice || 5000000])
  const [areaRange, setAreaRange] = useState([500, 5000])

  const updateFilter = (key: string, value: any) => {
    onFiltersChange({ ...filters, [key]: value })
  }

  const toggleAmenity = (amenityId: string) => {
    const currentAmenities = filters.amenities || []
    const newAmenities = currentAmenities.includes(amenityId)
      ? currentAmenities.filter((id) => id !== amenityId)
      : [...currentAmenities, amenityId]
    updateFilter("amenities", newAmenities)
  }

  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange(values)
    updateFilter("minPrice", values[0])
    updateFilter("maxPrice", values[1])
  }

  const hasActiveFilters = Object.values(filters).some((value) => {
    if (Array.isArray(value)) return value.length > 0
    return value !== undefined && value !== "" && value !== "all"
  })

  // Map amenity IDs to dictionary keys
  const amenityToKeyMap: Record<string, string> = {
    "parking": "parking",
    "wifi": "wifi",
    "gym": "gym",
    "security": "security",
    "garden": "garden",
    "pool": "swimmingPool",
  }

  const FilterContent = () => (
    <div className="space-y-6">
      {/* Search Query */}
      <div>
        <Label htmlFor="query" className="text-sm font-medium">
          Search Keywords
        </Label>
        <div className="relative mt-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="query"
            placeholder="Search by title, location, or features..."
            value={filters.query || ""}
            onChange={(e) => updateFilter("query", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Area */}
      <div>
        <Label htmlFor="area" className="text-sm font-medium">
          Area
        </Label>
        <div className="relative mt-1">
          <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            id="area"
            placeholder="Enter city, neighborhood, or address..."
            value={filters.area || ""}
            onChange={(e) => updateFilter("area", e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Category & Property Type */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Category</Label>
          <Select
            value={filters.category || "all"}
            onValueChange={(value) => updateFilter("category", value === "all" ? undefined : value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-sm font-medium">Property Type</Label>
          <Select
            value={filters.propertyType || "all"}
            onValueChange={(value) => updateFilter("propertyType", value === "all" ? undefined : value)}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="All Types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {propertyTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Price Range */}
      <div>
        <Label className="text-sm font-medium">Price Range</Label>
        <div className="mt-3 px-2">
          <Slider
            value={priceRange}
            onValueChange={handlePriceRangeChange}
            max={5000000}
            min={0}
            step={50000}
            className="w-full"
          />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>${priceRange[0].toLocaleString()}</span>
            <span>${priceRange[1].toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bedrooms & Bathrooms */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label className="text-sm font-medium">Bedrooms</Label>
          <Select
            value={filters.bedrooms?.toString() || "any"}
            onValueChange={(value) => updateFilter("bedrooms", value === "any" ? undefined : Number(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="0">Studio</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label className="text-sm font-medium">Bathrooms</Label>
          <Select
            value={filters.bathrooms?.toString() || "any"}
            onValueChange={(value) => updateFilter("bathrooms", value === "any" ? undefined : Number(value))}
          >
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Any" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              <SelectItem value="1">1+</SelectItem>
              <SelectItem value="2">2+</SelectItem>
              <SelectItem value="3">3+</SelectItem>
              <SelectItem value="4">4+</SelectItem>
              <SelectItem value="5">5+</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Area Range */}
      <div>
        <Label className="text-sm font-medium">Area (sq ft)</Label>
        <div className="mt-3 px-2">
          <Slider value={areaRange} onValueChange={setAreaRange} max={10000} min={200} step={100} className="w-full" />
          <div className="flex justify-between text-sm text-muted-foreground mt-2">
            <span>{areaRange[0]} sq ft</span>
            <span>{areaRange[1]} sq ft</span>
          </div>
        </div>
      </div>

      {/* Year Built */}
      <div>
        <Label htmlFor="yearBuilt" className="text-sm font-medium">
          Year Built (After)
        </Label>
        <Input
          id="yearBuilt"
          type="number"
          placeholder="e.g., 2000"
          value={filters.yearBuilt || ""}
          onChange={(e) => updateFilter("yearBuilt", e.target.value ? Number(e.target.value) : undefined)}
          className="mt-1"
          min="1900"
          max={new Date().getFullYear()}
        />
      </div>

      {/* Property Features */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Property Features</Label>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox
              id="furnished"
              checked={filters.furnished || false}
              onCheckedChange={(checked) => updateFilter("furnished", checked)}
            />
            <Label htmlFor="furnished" className="text-sm">
              Furnished
            </Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="petFriendly"
              checked={filters.petFriendly || false}
              onCheckedChange={(checked) => updateFilter("petFriendly", checked)}
            />
            <Label htmlFor="petFriendly" className="text-sm">
              Pet Friendly
            </Label>
          </div>
        </div>
      </div>

      {/* Amenities */}
      <div>
        <Label className="text-sm font-medium mb-3 block">Amenities</Label>
        <div className="grid grid-cols-2 gap-3">
          {amenitiesList.map((amenity) => {
            const amenityKey = amenityToKeyMap[amenity.id]
            const label = dict?.amenities?.[amenityKey as keyof typeof dict.amenities] || amenity.label
            return (
              <div
                key={amenity.id}
                className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  (filters.amenities || []).includes(amenity.id)
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
                onClick={() => toggleAmenity(amenity.id)}
              >
                <amenity.icon className="h-4 w-4" />
                <span className="text-sm">{label}</span>
              </div>
            )
          })}
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm font-medium">Active Filters</Label>
            <Button variant="ghost" size="sm" onClick={onClearFilters}>
              Clear All
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.propertyType && (
              <Badge variant="secondary" className="flex items-center gap-1">
                {filters.propertyType}
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
                {filters.area}
                <X className="h-3 w-3 cursor-pointer" onClick={() => updateFilter("area", undefined)} />
              </Badge>
            )}
            {(filters.amenities || []).map((amenity) => {
              const amenityKey = amenityToKeyMap[amenity]
              const label = dict?.amenities?.[amenityKey as keyof typeof dict.amenities] || amenity
              return (
                <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                  {label}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => toggleAmenity(amenity)} />
                </Badge>
              )
            })}
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
            <Filter className="w-4 h-4 mr-2" />
            Advanced Filters {hasActiveFilters && `(${Object.keys(filters).length})`}
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[90vh] overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Advanced Search Filters</SheetTitle>
          </SheetHeader>
          <div className="mt-6">
            <FilterContent />
          </div>
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Filter className="w-5 h-5 mr-2" />
          Advanced Search Filters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <FilterContent />
      </CardContent>
    </Card>
  )
}
