"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { SlidersHorizontal, X } from "lucide-react"
import { getCategories } from "@/lib/supabase/queries"

interface SearchFiltersSheetProps {
  lng: string
  dict: any
}

export function SearchFiltersSheet({ lng, dict }: SearchFiltersSheetProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [categories, setCategories] = useState<any[]>([])
  const [filters, setFilters] = useState({
    category: "all",
    propertyType: "all",
    minPrice: 0,
    maxPrice: 10000000,
    bedrooms: "any",
    bathrooms: "any",
    minSize: 0,
    maxSize: 1000,
    location: "",
    amenities: [] as string[],
  })

  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const loadCategories = async () => {
      const data = await getCategories()
      setCategories(data)
    }
    loadCategories()

    // Load filters from URL
    const urlFilters = {
      category: searchParams.get("category") || "all",
      propertyType: searchParams.get("type") || "all",
      minPrice: Number.parseInt(searchParams.get("minPrice") || "0"),
      maxPrice: Number.parseInt(searchParams.get("maxPrice") || "10000000"),
      bedrooms: searchParams.get("bedrooms") || "any",
      bathrooms: searchParams.get("bathrooms") || "any",
      minSize: Number.parseInt(searchParams.get("minSize") || "0"),
      maxSize: Number.parseInt(searchParams.get("maxSize") || "1000"),
      location: searchParams.get("location") || "",
      amenities: searchParams.get("amenities")?.split(",").filter(Boolean) || [],
    }
    setFilters(urlFilters)
  }, [searchParams])

  const amenitiesList = [
    { value: "Parking", label: dict.amenities.parking },
    { value: "Swimming Pool", label: dict.amenities.swimmingPool },
    { value: "Gym", label: dict.amenities.gym },
    { value: "Garden", label: dict.amenities.garden },
    { value: "Balcony", label: dict.amenities.balcony },
    { value: "Elevator", label: dict.amenities.elevator },
    { value: "Security", label: dict.amenities.security },
    { value: "Central AC", label: dict.amenities.centralAC },
    { value: "Kitchen Appliances", label: dict.amenities.kitchenAppliances },
    { value: "Furnished", label: dict.amenities.furnished },
  ]

  const handleAmenityChange = (amenity: string, checked: boolean) => {
    setFilters((prev) => ({
      ...prev,
      amenities: checked ? [...prev.amenities, amenity] : prev.amenities.filter((a) => a !== amenity),
    }))
  }

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams.toString())

    // Clear existing filter params
    const filterKeys = [
      "category",
      "type",
      "minPrice",
      "maxPrice",
      "bedrooms",
      "bathrooms",
      "minSize",
      "maxSize",
      "location",
      "amenities",
    ]
    filterKeys.forEach((key) => params.delete(key))

    // Add new filter params
    if (filters.category !== "all") params.set("category", filters.category)
    if (filters.propertyType !== "all") params.set("type", filters.propertyType)
    if (filters.minPrice > 0) params.set("minPrice", filters.minPrice.toString())
    if (filters.maxPrice < 10000000) params.set("maxPrice", filters.maxPrice.toString())
    if (filters.bedrooms !== "any") params.set("bedrooms", filters.bedrooms)
    if (filters.bathrooms !== "any") params.set("bathrooms", filters.bathrooms)
    if (filters.minSize > 0) params.set("minSize", filters.minSize.toString())
    if (filters.maxSize < 1000) params.set("maxSize", filters.maxSize.toString())
    if (filters.location) params.set("location", filters.location)
    if (filters.amenities.length > 0) params.set("amenities", filters.amenities.join(","))

    router.push(`/${lng}/search?${params.toString()}`)
    setIsOpen(false)
  }

  const clearFilters = () => {
    const params = new URLSearchParams(searchParams.toString())
    const filterKeys = [
      "category",
      "type",
      "minPrice",
      "maxPrice",
      "bedrooms",
      "bathrooms",
      "minSize",
      "maxSize",
      "location",
      "amenities",
    ]
    filterKeys.forEach((key) => params.delete(key))

    setFilters({
      category: "all",
      propertyType: "all",
      minPrice: 0,
      maxPrice: 10000000,
      bedrooms: "any",
      bathrooms: "any",
      minSize: 0,
      maxSize: 1000,
      location: "",
      amenities: [],
    })

    router.push(`/${lng}/search?${params.toString()}`)
  }

  const activeFiltersCount = Object.entries(filters).reduce((count, [key, value]) => {
    if (key === "amenities") return count + (value as string[]).length
    if (key === "minPrice" && typeof value === "number" && value > 0) return count + 1
    if (key === "maxPrice" && typeof value === "number" && value < 10000000) return count + 1
    if (key === "minSize" && typeof value === "number" && value > 0) return count + 1
    if (key === "maxSize" && typeof value === "number" && value < 1000) return count + 1
    if (value && value !== "" && value !== "any" && value !== "all") return count + 1
    return count
  }, 0)

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="relative bg-transparent sm:hidden">
          <SlidersHorizontal className="h-4 w-4 mr-2" />
          {dict.search.filters}
          {activeFiltersCount > 0 && (
            <Badge
              variant="secondary"
              className="ml-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{dict.search.filters}</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Category */}
          <div className="space-y-2">
            <Label>{dict.search.propertyType}</Label>
            <Select
              value={filters.category}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {lng === "ar" ? category.name_ar : category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Property Type */}
          <div className="space-y-2">
            <Label>Listing Type</Label>
            <Select
              value={filters.propertyType}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, propertyType: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sale">For Sale</SelectItem>
                <SelectItem value="rent">For Rent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <Label>{dict.search.priceRange}</Label>
            <div className="px-2">
              <Slider
                value={[filters.minPrice, filters.maxPrice]}
                onValueChange={([min, max]) => setFilters((prev) => ({ ...prev, minPrice: min, maxPrice: max }))}
                max={10000000}
                min={0}
                step={50000}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{(filters.minPrice / 1000000).toFixed(1)}M</span>
              <span>-</span>
              <span>{(filters.maxPrice / 1000000).toFixed(1)}M EGP</span>
            </div>
          </div>

          {/* Bedrooms */}
          <div className="space-y-2">
            <Label>{dict.search.bedrooms}</Label>
            <Select
              value={filters.bedrooms}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, bedrooms: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
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

          {/* Bathrooms */}
          <div className="space-y-2">
            <Label>{dict.search.bathrooms}</Label>
            <Select
              value={filters.bathrooms}
              onValueChange={(value) => setFilters((prev) => ({ ...prev, bathrooms: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Any" />
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

          {/* Size Range */}
          <div className="space-y-3">
            <Label>{dict.search.size}</Label>
            <div className="px-2">
              <Slider
                value={[filters.minSize, filters.maxSize]}
                onValueChange={([min, max]) => setFilters((prev) => ({ ...prev, minSize: min, maxSize: max }))}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
            </div>
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <span>{filters.minSize}m²</span>
              <span>-</span>
              <span>{filters.maxSize}m²</span>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-2">
            <Label>{dict.search.location}</Label>
            <Input
              value={filters.location}
              onChange={(e) => setFilters((prev) => ({ ...prev, location: e.target.value }))}
              placeholder="Enter location"
            />
          </div>

          {/* Amenities */}
          <div className="space-y-3">
            <Label>{dict.search.amenities}</Label>
            <div className="grid grid-cols-2 gap-2">
              {amenitiesList.map((amenity) => (
                <div key={amenity.value} className="flex items-center space-x-2">
                  <Checkbox
                    id={amenity.value}
                    checked={filters.amenities.includes(amenity.value)}
                    onCheckedChange={(checked) => handleAmenityChange(amenity.value, checked as boolean)}
                  />
                  <Label htmlFor={amenity.value} className="text-sm">
                    {amenity.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-2 pt-4 border-t">
            <Button variant="outline" onClick={clearFilters} className="flex-1 bg-transparent">
              <X className="h-4 w-4 mr-2" />
              {dict.search.clearFilters}
            </Button>
            <Button onClick={applyFilters} className="flex-1">
              {dict.search.applyFilters}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}