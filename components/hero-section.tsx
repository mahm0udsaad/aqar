"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Search, MapPin, Home, Building2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface Area {
  id: string
  name: string
  slug: string
}

interface HeroSectionProps {
  lng: string
  dict: any
  areas: Area[]
}

export function HeroSection({ lng, dict, areas }: HeroSectionProps) {
  const router = useRouter()
  const [searchData, setSearchData] = useState({
    type: "sale" as "sale" | "rent",
    location: "",
    area: "",
    priceRange: "any",
  })

  const handleSearch = () => {
    const params = new URLSearchParams()
    params.set("type", searchData.type)
    if (searchData.location) params.set("q", searchData.location)
    if (searchData.area) params.set("location", searchData.area)
    if (searchData.priceRange && searchData.priceRange !== "any") {
      const [min, max] = searchData.priceRange.split("-")
      if (min) params.set("minPrice", min)
      if (max) params.set("maxPrice", max)
    }

    router.push(`/${lng}/search?${params.toString()}`)
  }

  return (
    <section className="relative min-h-[700px] lg:min-h-[800px] flex items-center justify-center overflow-hidden">
      {/* Background with Apartment Image */}
      <div className="absolute inset-0 z-0">
        {/* Gradient overlay for better text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60 z-10" />
        {/* Background image */}
        <div 
          className="w-full h-full bg-cover bg-center bg-no-repeat transform scale-105"
          style={{
            backgroundImage: `url('/images/hero-apartment-balcony.jpg')`,
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight drop-shadow-2xl">
            {dict.hero.heroTitleFull}
          </h1>
          <p className="text-lg md:text-xl lg:text-2xl text-white/95 mb-12 max-w-3xl mx-auto leading-relaxed drop-shadow-lg">
            {dict.hero.heroSubtitleFull}
          </p>
        </div>

        {/* Search Card */}
        <Card className="bg-white/95 backdrop-blur-sm shadow-2xl border-0 max-w-5xl mx-auto">
          <CardContent className="p-6 md:p-8">
            {/* Property Type Tabs */}
            <div className="flex mb-6 bg-slate-100 rounded-lg p-1">
              <button
                onClick={() => setSearchData((prev) => ({ ...prev, type: "sale" }))}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  searchData.type === "sale"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {dict.hero.forSale}
              </button>
              <button
                onClick={() => setSearchData((prev) => ({ ...prev, type: "rent" }))}
                className={`flex-1 flex items-center justify-center py-3 px-4 rounded-md font-medium transition-all duration-200 ${
                  searchData.type === "rent"
                    ? "bg-white text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {dict.hero.forRent}
              </button>
            </div>

            {/* Search Form */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Location Input */}
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                <Input
                  placeholder="Enter area, neighborhood, or project name"
                  value={searchData.location}
                  onChange={(e) => setSearchData((prev) => ({ ...prev, location: e.target.value }))}
                  className="pl-10 h-12 border-input focus:border-primary focus:ring-primary"
                />
              </div>

              {/* Area Select */}
              <Select
                value={searchData.area}
                onValueChange={(value) => setSearchData((prev) => ({ ...prev, area: value }))}
              >
                <SelectTrigger className="h-12 border-input focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Select Area" />
                </SelectTrigger>
                <SelectContent>
                  {areas.map((area) => (
                    <SelectItem key={area.id} value={area.name}>
                      {area.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Price Range */}
              <Select
                value={searchData.priceRange}
                onValueChange={(value) => setSearchData((prev) => ({ ...prev, priceRange: value }))}
              >
                <SelectTrigger className="h-12 border-input focus:border-primary focus:ring-primary">
                  <SelectValue placeholder="Price Range" />
                </SelectTrigger>
                <SelectContent>
                  {priceRanges[searchData.type].map((range) => (
                    <SelectItem key={range.value} value={range.value}>
                      {range.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Search Button */}
              <Button 
                onClick={handleSearch} 
                className="h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold transition-all duration-200 hover:scale-105"
              >
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex flex-wrap justify-center gap-8 mt-8 pt-8 border-t border-slate-200">
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">250K+</div>
                <div className="text-sm text-muted-foreground">Properties for Sale</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">109K+</div>
                <div className="text-sm text-muted-foreground">Properties for Rent</div>
              </div>
              <div className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-foreground">15K+</div>
                <div className="text-sm text-muted-foreground">New Projects</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  )
}

interface HeroSectionProps {
  lng: string
  dict: any
}

const propertyTypes = [
  { value: "sale", label: "For Sale", icon: Home },
  { value: "rent", label: "For Rent", icon: Building2 },
]

// Areas are now passed as props from the parent component

const priceRanges = {
  sale: [
    { label: "Any Price", value: "any" },
    { label: "1M - 3M EGP", value: "1000000-3000000" },
    { label: "3M - 5M EGP", value: "3000000-5000000" },
    { label: "5M - 10M EGP", value: "5000000-10000000" },
    { label: "Over 10M EGP", value: "10000000-" },
  ],
  rent: [
    { label: "Any Price", value: "any" },
    { label: "Under 5K EGP", value: "0-5000" },
    { label: "5K - 10K EGP", value: "5000-10000" },
    { label: "10K - 20K EGP", value: "10000-20000" },
    { label: "20K - 50K EGP", value: "20000-50000" },
    { label: "Over 50K EGP", value: "50000-" },
  ],
}
