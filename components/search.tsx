"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { Navbar } from "@/components/navbar"
import { Footer } from "@/components/footer"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import type { Locale } from "@/lib/i18n/config"
import {  Search as SearchIcon} from "lucide-react"
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

    </div>
  )
}

