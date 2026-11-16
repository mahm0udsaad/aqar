import "server-only"
import { db as supabase, escapeLike } from "@/lib/db"
import type { Database } from "./types"

type Property = Database["public"]["Tables"]["properties"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"]
type PropertyRating = Database["public"]["Tables"]["property_ratings"]["Row"]
type PropertyVideo = Database["public"]["Tables"]["property_videos"]["Row"]
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"]
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"]
type Area = Database["public"]["Tables"]["areas"]["Row"]
type HomeHero = Database["public"]["Tables"]["home_hero"]["Row"]
type HomeStat = Database["public"]["Tables"]["home_stats"]["Row"]

export interface PropertyWithDetails extends Property {
  categories: Category | null
  property_images: PropertyImage[]
  property_ratings: PropertyRating | null
  areas: Area | null
  location_iframe_url: string | null
  property_videos?: PropertyVideo[]
}

export interface SearchFilters {
  category?: string
  minPrice?: number
  maxPrice?: number
  bedrooms?: number
  bathrooms?: number
  location?: string
  propertyType?: "sale" | "rent"
  amenities?: string[]
  features?: string[]
  minSize?: number
  maxSize?: number
  area?: string
  ownerType?: "owner" | "broker"
  isNew?: boolean
  isFeatured?: boolean
  isVerified?: boolean
  minPricePerMeter?: number
  maxPricePerMeter?: number
  floor?: number
  yearBuilt?: number
}

// Applies the shared listing filters. User-provided text goes through escapeLike + orFilters,
// never into a raw PostgREST-style string.
function applyFilters(query: any, filters?: SearchFilters) {
  if (!filters) return query
  const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) ? v : undefined)
  const text = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim().slice(0, 100) : undefined)

  if (text(filters.category)) query = query.eq("category_id", text(filters.category))
  if (num(filters.minPrice)) query = query.gte("price", filters.minPrice)
  if (num(filters.maxPrice)) query = query.lte("price", filters.maxPrice)
  if (num(filters.bedrooms)) query = query.eq("bedrooms", filters.bedrooms)
  if (num(filters.bathrooms)) query = query.eq("bathrooms", filters.bathrooms)
  const location = text(filters.location)
  if (location) {
    const like = `%${escapeLike(location)}%`
    query = query.orFilters([
      { col: "location", op: "ilike", val: like },
      { col: "location_en", op: "ilike", val: like },
      { col: "location_ar", op: "ilike", val: like },
      { col: "area", op: "ilike", val: like },
    ])
  }
  if (filters.propertyType === "sale" || filters.propertyType === "rent") query = query.eq("property_type", filters.propertyType)
  if (filters.ownerType === "owner" || filters.ownerType === "broker") query = query.eq("owner_type", filters.ownerType)
  if (num(filters.minSize)) query = query.gte("size", filters.minSize)
  if (num(filters.maxSize)) query = query.lte("size", filters.maxSize)
  if (Array.isArray(filters.amenities) && filters.amenities.length > 0) query = query.contains("amenities", filters.amenities.map(String))
  if (Array.isArray(filters.features) && filters.features.length > 0) query = query.contains("features", filters.features.map(String))
  if (text(filters.area)) query = query.ilike("area", `%${escapeLike(text(filters.area)!)}%`)
  if (typeof filters.isNew === "boolean") query = query.eq("is_new", filters.isNew)
  if (typeof filters.isFeatured === "boolean") query = query.eq("is_featured", filters.isFeatured)
  if (typeof filters.isVerified === "boolean") query = query.eq("is_verified", filters.isVerified)
  if (num(filters.minPricePerMeter)) query = query.gte("price_per_meter", filters.minPricePerMeter)
  if (num(filters.maxPricePerMeter)) query = query.lte("price_per_meter", filters.maxPricePerMeter)
  if (num(filters.floor)) query = query.eq("floor", filters.floor)
  if (num(filters.yearBuilt)) query = query.eq("year_built", filters.yearBuilt)
  return query
}

function sortImages(rows: any[]) {
  rows.forEach((p) => p?.property_images?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0)))
  return rows
}

// Properties
export async function getProperties(filters?: SearchFilters) {
  const query = applyFilters(
    supabase
      .from("properties")
      .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*),
      areas (*)
    `)
      .eq("status", "active"),
    filters,
  ).order("order_index", { ascending: true })

  const { data, error } = await query

  if (error) {
    console.error("Error fetching properties:", error)
    return []
  }

  return sortImages(data) as PropertyWithDetails[]
}

export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*),
      areas (*),
      property_videos (*)
    `)
    .eq("id", id)
    .eq("status", "active")
    .single()

  if (error) {
    console.error("Error fetching property:", error)
    return null
  }

  // Sort property images by order_index
  if (data.property_images) {
    data.property_images.sort((a: PropertyImage, b: PropertyImage) => (a.order_index || 0) - (b.order_index || 0))
  }

  // Sort property videos by order_index
  if ((data as any).property_videos) {
    ;(data as any).property_videos.sort((a: PropertyVideo, b: PropertyVideo) => (a.order_index || 0) - (b.order_index || 0))
  }

  return data as PropertyWithDetails
}

export async function getFeaturedProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*)
    `)
    .eq("is_featured", true)
    .eq("status", "active")
    .order("is_main_featured", { ascending: false })
    .order("order_index", { ascending: true })
    .limit(6)

  if (error) {
    console.error("Error fetching featured properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(property => {
    if (property.property_images) {
      property.property_images.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }
  })

  return data as PropertyWithDetails[]
}

export async function getNewProperties() {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*)
    `)
    .eq("is_new", true)
    .eq("status", "active")
    .order("order_index", { ascending: true })
    .limit(6)

  if (error) {
    console.error("Error fetching new properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(property => {
    if (property.property_images) {
      property.property_images.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
    }
  })

  return data as PropertyWithDetails[]
}

// Categories
export async function getCategories() {
  const { data, error } = await supabase.from("categories").select("*").order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching categories:", error)
    return []
  }

  return data
}

export async function getCategoryBySlug(slug: string) {
  const { data, error } = await supabase.from("categories").select("*").eq("slug", slug).single()

  if (error) {
    console.error("Error fetching category:", error)
    return null
  }

  return data
}

export async function searchProperties(query: string, filters?: SearchFilters) {
  let searchQuery = supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*),
      areas (*)
    `)
    .eq("status", "active")

  const q = typeof query === "string" ? query.trim().slice(0, 100) : ""
  if (q) {
    const like = `%${escapeLike(q)}%`
    searchQuery = searchQuery.orFilters(
      ["title", "title_en", "title_ar", "description", "location", "location_en", "location_ar", "area"].map((col) => ({
        col,
        op: "ilike" as const,
        val: like,
      })),
    )
  }

  searchQuery = applyFilters(searchQuery, filters).order("order_index", { ascending: true })

  const { data, error } = await searchQuery

  if (error) {
    console.error("Error searching properties:", error)
    return []
  }

  return sortImages(data) as PropertyWithDetails[]
}

export async function getPopularAreasWithCounts() {
  try {
    // Use a regular SQL query to get area counts
    const { data, error } = await supabase
      .from("properties")
      .select("area")
      .eq("status", "active")
      .not("area", "is", null)
      .not("area", "eq", "")

    if (error) {
      console.error("Error fetching properties for area counts:", error);
      throw error;
    }

    // Count areas manually and format the result
    const areaCounts: { [key: string]: number } = {};
    data.forEach((property) => {
      if (property.area) {
        areaCounts[property.area] = (areaCounts[property.area] || 0) + 1;
      }
    });

    // Sort by count and take top 6
    const sortedAreas = Object.entries(areaCounts)
      .sort((a: [string, number], b: [string, number]) => b[1] - a[1])
      .slice(0, 6)
      .map(([name, count]: [string, number]) => ({
        name,
        count,
        trend: count > 100 ? "+15%" : count > 50 ? "+10%" : count > 20 ? "+8%" : "+5%"
      }));

    return sortedAreas;
  } catch (error) {
    console.error("Error fetching popular areas with counts:", error);
    // Fallback to static areas if there's any error
    const fallbackAreas = [
      { name: "New Cairo", count: 150, trend: "+12%" },
      { name: "Sheikh Zayed", count: 120, trend: "+8%" },
      { name: "Maadi", count: 95, trend: "+15%" },
      { name: "Zamalek", count: 80, trend: "+5%" },
      { name: "Heliopolis", count: 75, trend: "+10%" },
      { name: "Nasr City", count: 65, trend: "+7%" }
    ];
    return fallbackAreas;
  }
}

// Admin: Get all properties (including inactive)
export async function getAllPropertiesForAdmin() {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (id, name),
      property_images (id, url, alt_text, is_main, order_index)
    `)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching properties for admin:", error)
    throw error
  }

  return data
}

// Home content: hero and stats
export async function getHomeHero(): Promise<HomeHero | null> {
  const { data, error } = await supabase
    .from("home_hero")
    .select("*")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single()
  if (error && error.code !== "PGRST116") {
    console.error("Error fetching home hero:", error)
    return null
  }
  return data as HomeHero | null
}

export async function getHomeStats(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("home_stats").select("key,value").order("key")
  if (error) {
    console.error("Error fetching home stats:", error)
    return {}
  }
  const map: Record<string, string> = {}
  data?.forEach((row: any) => {
    map[row.key] = row.value
  })
  return map
}
