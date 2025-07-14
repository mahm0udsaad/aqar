"use client"

import { useState } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Search, X } from "lucide-react"
import { Dictionary } from "@/lib/i18n/types"

interface Category {
  id: string
  name: string
}

interface PropertySearchFiltersProps {
  categories: Category[]
  dict: Dictionary
}

export function PropertySearchFilters({ categories, dict }: PropertySearchFiltersProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  
  const [search, setSearch] = useState(searchParams.get("search") || "")
  const [category, setCategory] = useState(searchParams.get("category") || "all")
  const [status, setStatus] = useState(searchParams.get("status") || "all")

  const updateFilters = (newSearch?: string, newCategory?: string, newStatus?: string) => {
    const params = new URLSearchParams(searchParams.toString())
    
    if (newSearch !== undefined) {
      if (newSearch) {
        params.set("search", newSearch)
      } else {
        params.delete("search")
      }
    }
    
    if (newCategory !== undefined) {
      if (newCategory && newCategory !== "all") {
        params.set("category", newCategory)
      } else {
        params.delete("category")
      }
    }
    
    if (newStatus !== undefined) {
      if (newStatus && newStatus !== "all") {
        params.set("status", newStatus)
      } else {
        params.delete("status")
      }
    }

    router.push(`${pathname}?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearch("")
    setCategory("all")
    setStatus("all")
    router.push(pathname)
  }

  const hasActiveFilters = search || (category && category !== "all") || (status && status !== "all")

  return (
    <div className="flex flex-col sm:flex-row gap-4 flex-1 max-w-4xl">
      {/* Search Input */}
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder={dict.admin.properties.search.placeholder}
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            // Debounce the search
            const timer = setTimeout(() => {
              updateFilters(e.target.value, undefined, undefined)
            }, 300)
            return () => clearTimeout(timer)
          }}
          className="pl-10"
        />
      </div>

      {/* Category Filter */}
      <Select
        value={category}
        onValueChange={(value) => {
          setCategory(value)
          updateFilters(undefined, value, undefined)
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={dict.admin.properties.search.allCategories} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{dict.admin.properties.search.allCategories}</SelectItem>
          {categories.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status Filter */}
      <Select
        value={status}
        onValueChange={(value) => {
          setStatus(value)
          updateFilters(undefined, undefined, value)
        }}
      >
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder={dict.admin.properties.search.allStatuses} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">{dict.admin.properties.search.allStatuses}</SelectItem>
          <SelectItem value="active">{dict.admin.properties.search.active}</SelectItem>
          <SelectItem value="draft">{dict.admin.properties.search.draft}</SelectItem>
          <SelectItem value="sold">{dict.admin.properties.search.sold}</SelectItem>
          <SelectItem value="rented">{dict.admin.properties.search.rented}</SelectItem>
          <SelectItem value="inactive">{dict.admin.properties.search.inactive}</SelectItem>
        </SelectContent>
      </Select>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button variant="outline" onClick={clearFilters} size="icon">
          <X className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
} 