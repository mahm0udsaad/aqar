"use server"

/**
 * Read-only data for client components. These are public server actions, so they
 * only ever return active listings and categories, and they validate their input.
 */
import { z } from "zod"
import { getCategories, getProperties, searchProperties, type SearchFilters } from "@/lib/supabase/queries"

const num = z.coerce.number().finite().nonnegative().optional()
const str = z.string().trim().max(100).optional()

const FiltersSchema = z
  .object({
    category: str,
    minPrice: num,
    maxPrice: num,
    bedrooms: num,
    bathrooms: num,
    location: str,
    propertyType: z.enum(["sale", "rent"]).optional(),
    amenities: z.array(z.string().max(60)).max(30).optional(),
    features: z.array(z.string().max(60)).max(30).optional(),
    minSize: num,
    maxSize: num,
    area: str,
    ownerType: z.enum(["owner", "broker"]).optional(),
    isNew: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isVerified: z.boolean().optional(),
    minPricePerMeter: num,
    maxPricePerMeter: num,
    floor: z.coerce.number().int().optional(),
    yearBuilt: z.coerce.number().int().optional(),
  })
  .partial()

function cleanFilters(filters: unknown): SearchFilters | undefined {
  if (!filters || typeof filters !== "object") return undefined
  const parsed = FiltersSchema.safeParse(
    Object.fromEntries(Object.entries(filters as Record<string, unknown>).filter(([, v]) => v !== "" && v !== null && v !== undefined)),
  )
  return parsed.success ? (parsed.data as SearchFilters) : undefined
}

export async function fetchProperties(filters?: SearchFilters) {
  return getProperties(cleanFilters(filters))
}

export async function fetchSearchProperties(query: string, filters?: SearchFilters) {
  return searchProperties(typeof query === "string" ? query.slice(0, 100) : "", cleanFilters(filters))
}

export async function fetchCategories() {
  return getCategories()
}
