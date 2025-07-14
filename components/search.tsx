"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { properties } from "@/lib/data"
import { filterProperties } from "@/lib/utils"
import type { SearchFilters as SearchFiltersType } from "@/lib/types"
import type { Locale } from "@/lib/i18n/config"
import { Grid, List, Search as SearchIcon, Map, SlidersHorizontal, Sparkles, Building } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { SearchContent } from "@/components/search-content"
import { SearchFiltersSheet } from "@/components/search-filters-sheet"

interface SearchProps {
  dict: any
  lng: Locale
  searchParams: { [key: string]: string | string[] | undefined }
}

function SearchSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <Skeleton className="h-6 w-20 mb-4" />
              <div className="space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="lg:col-span-3">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-10 w-32" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {Array.from({ length: 9 }).map((_, i) => (
                <Card key={i}>
                  <Skeleton className="h-48 w-full" />
                  <CardContent className="p-4">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-4" />
                    <Skeleton className="h-8 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function Search({ dict, lng, searchParams }: SearchProps) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar lng={lng} dict={dict} />
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-3">
          <form className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4 w-full">
            {/* Location Input */}
            <div className="flex-1">
              <Input
                placeholder={dict.search.locationPlaceholder || 'Location (e.g. New Cairo, Zamalek...)'}
                className="w-full"
                name="location"
                autoComplete="off"
              />
            </div>
            {/* Property Type */}
            <div className="flex-1">
              <Select>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={dict.search.propertyType || 'Property Type'} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="apartment">{dict.search.apartment || 'Apartment'}</SelectItem>
                  <SelectItem value="villa">{dict.search.villa || 'Villa'}</SelectItem>
                  <SelectItem value="land">{dict.search.land || 'Land'}</SelectItem>
                  <SelectItem value="commercial">{dict.search.commercial || 'Commercial'}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {/* Price Range */}
            <div className="flex-1 hidden sm:block">
              <Input
                type="text"
                placeholder={dict.search.priceRange || 'Price Range'}
                className="w-full"
                name="price"
                autoComplete="off"
              />
            </div>
            {/* Filters & Search Button */}
            <div className="flex items-center gap-2">
              {/* Show filter sheet only on mobile */}
              <div className="sm:hidden">
                <SearchFiltersSheet lng={lng} dict={dict} />
              </div>
              <Select>
                <SelectTrigger className="w-[120px] sm:w-[180px]">
                  <SelectValue placeholder={dict.search.sortBy} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">{dict.search.newest}</SelectItem>
                  <SelectItem value="price-asc">{dict.search.priceAsc}</SelectItem>
                  <SelectItem value="price-desc">{dict.search.priceDesc}</SelectItem>
                </SelectContent>
              </Select>
              <Button type="submit" variant="default" className="flex items-center gap-2 px-4">
                <SearchIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{dict.search.searchButton || 'Search'}</span>
              </Button>
            </div>
          </form>
        </div>
      </div>
      <main>
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-bold mb-2">{dict.search.title}</h1>
            <p className="text-muted-foreground text-base sm:text-lg">{dict.search.subtitle}</p>
          </div>

          <Suspense fallback={<SearchSkeleton />}> 
            <SearchContent lng={lng} dict={dict} searchParams={searchParams} />
          </Suspense>
        </div>
      </main>

      <Footer lng={lng} dict={dict} />
    </div>
  )
}

