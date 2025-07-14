import { supabase } from "./client"
import type { Database } from "./types"

type Property = Database["public"]["Tables"]["properties"]["Row"]
type Category = Database["public"]["Tables"]["categories"]["Row"]
type PropertyImage = Database["public"]["Tables"]["property_images"]["Row"]
type PropertyRating = Database["public"]["Tables"]["property_ratings"]["Row"]
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"]
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"]

export interface PropertyWithDetails extends Property {
  categories: Category | null
  property_images: PropertyImage[]
  property_ratings: PropertyRating | null
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

// Properties
export async function getProperties(filters?: SearchFilters) {
  let query = supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*)
    `)
    .eq("status", "active")
    .order("created_at", { ascending: false })

  if (filters?.category) {
    query = query.eq("category_id", filters.category)
  }

  if (filters?.minPrice) {
    query = query.gte("price", filters.minPrice)
  }

  if (filters?.maxPrice) {
    query = query.lte("price", filters.maxPrice)
  }

  if (filters?.bedrooms) {
    query = query.eq("bedrooms", filters.bedrooms)
  }

  if (filters?.bathrooms) {
    query = query.eq("bathrooms", filters.bathrooms)
  }

  if (filters?.location) {
    query = query.or(`location.ilike.%${filters.location}%,area.ilike.%${filters.location}%`)
  }

  if (filters?.propertyType) {
    query = query.eq("property_type", filters.propertyType)
  }

  if (filters?.ownerType) {
    query = query.eq("owner_type", filters.ownerType)
  }

  if (filters?.minSize) {
    query = query.gte("size", filters.minSize)
  }

  if (filters?.maxSize) {
    query = query.lte("size", filters.maxSize)
  }

  if (filters?.amenities && filters.amenities.length > 0) {
    query = query.contains("amenities", filters.amenities)
  }

  if (filters?.features && filters.features.length > 0) {
    query = query.contains("features", filters.features)
  }

  if (filters?.area) {
    query = query.ilike("area", `%${filters.area}%`)
  }

  if (filters?.isNew !== undefined) {
    query = query.eq("is_new", filters.isNew)
  }

  if (filters?.isFeatured !== undefined) {
    query = query.eq("is_featured", filters.isFeatured)
  }

  if (filters?.isVerified !== undefined) {
    query = query.eq("is_verified", filters.isVerified)
  }

  if (filters?.minPricePerMeter) {
    query = query.gte("price_per_meter", filters.minPricePerMeter)
  }

  if (filters?.maxPricePerMeter) {
    query = query.lte("price_per_meter", filters.maxPricePerMeter)
  }

  if (filters?.floor) {
    query = query.eq("floor", filters.floor)
  }

  if (filters?.yearBuilt) {
    query = query.eq("year_built", filters.yearBuilt)
  }

  const { data, error } = await query

  if (error) {
    console.error("Error fetching properties:", error)
    return []
  }

  return data as PropertyWithDetails[]
}

export async function getPropertyById(id: string) {
  const { data, error } = await supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*)
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
    data.property_images.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
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
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching featured properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(property => {
    if (property.property_images) {
      property.property_images.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
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
    .order("created_at", { ascending: false })
    .limit(6)

  if (error) {
    console.error("Error fetching new properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(property => {
    if (property.property_images) {
      property.property_images.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
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

// Property Images
export async function getPropertyImages(propertyId: string) {
  const { data, error } = await supabase
    .from("property_images")
    .select("*")
    .eq("property_id", propertyId)
    .order("order_index", { ascending: true })

  if (error) {
    console.error("Error fetching property images:", error)
    return []
  }

  return data
}

export async function createPropertyImage(image: Database["public"]["Tables"]["property_images"]["Insert"]) {
  const { data, error } = await supabase.from("property_images").insert(image).select().single()

  if (error) {
    console.error("Error creating property image:", error)
    throw error
  }

  return data
}

export async function updatePropertyImage(id: string, updates: Database["public"]["Tables"]["property_images"]["Update"]) {
  const { data, error } = await supabase.from("property_images").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating property image:", error)
    throw error
  }

  return data
}

export async function deletePropertyImage(id: string) {
  const { error } = await supabase.from("property_images").delete().eq("id", id)

  if (error) {
    console.error("Error deleting property image:", error)
    throw error
  }
}

// Property Ratings
export async function getPropertyRatings(propertyId: string) {
  const { data, error } = await supabase
    .from("property_ratings")
    .select("*")
    .eq("property_id", propertyId)
    .single()

  if (error) {
    console.error("Error fetching property ratings:", error)
    return null
  }

  return data
}

export async function createPropertyRating(rating: Database["public"]["Tables"]["property_ratings"]["Insert"]) {
  const { data, error } = await supabase.from("property_ratings").insert(rating).select().single()

  if (error) {
    console.error("Error creating property rating:", error)
    throw error
  }

  return data
}

export async function updatePropertyRating(id: string, updates: Database["public"]["Tables"]["property_ratings"]["Update"]) {
  const { data, error } = await supabase.from("property_ratings").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating property rating:", error)
    throw error
  }

  return data
}

// Admin functions
export async function createProperty(property: PropertyInsert) {
  const { data, error } = await supabase.from("properties").insert(property).select().single()

  if (error) {
    console.error("Error creating property:", error)
    throw error
  }

  return data
}

export async function updateProperty(id: string, updates: PropertyUpdate) {
  const { data, error } = await supabase.from("properties").update(updates).eq("id", id).select().single()

  if (error) {
    console.error("Error updating property:", error)
    throw error
  }

  return data
}

export async function deleteProperty(id: string) {
  const { error } = await supabase.from("properties").delete().eq("id", id)

  if (error) {
    console.error("Error deleting property:", error)
    throw error
  }
}

// Increment property views
export async function incrementPropertyViews(propertyId: string) {
  const { error } = await supabase.rpc("increment_property_views", {
    property_id: propertyId,
  })

  if (error) {
    console.error("Error incrementing property views:", error)
  }
}

// Loved Properties
export async function getLikedProperties(userId: string) {
  const { data, error } = await supabase
    .from("loved_properties")
    .select(`
      *,
      properties!inner(
        *,
        categories (*),
        property_images (*)
      )
    `)
    .eq("user_id", userId)
    .eq("properties.status", "active")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("Error fetching liked properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(item => {
    if (item.properties?.property_images) {
      item.properties.property_images.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }
  })

  return data
}

export async function toggleLikedProperty(userId: string, propertyId: string) {
  // First check if the property is already liked
  const { data: existing, error: checkError } = await supabase
    .from("loved_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single()

  if (checkError && checkError.code !== "PGRST116") {
    console.error("Error checking liked property:", checkError)
    throw checkError
  }

  if (existing) {
    // Remove from favorites
    const { error } = await supabase.from("loved_properties").delete().eq("id", existing.id)

    if (error) {
      console.error("Error removing from favorites:", error)
      throw error
    }

    return false
  } else {
    // Add to favorites
    const { error } = await supabase.from("loved_properties").insert({
      user_id: userId,
      property_id: propertyId,
    })

    if (error) {
      console.error("Error adding to favorites:", error)
      throw error
    }

    return true
  }
}

export async function isPropertyLiked(userId: string, propertyId: string) {
  const { data, error } = await supabase
    .from("loved_properties")
    .select("id")
    .eq("user_id", userId)
    .eq("property_id", propertyId)
    .single()

  if (error && error.code !== "PGRST116") {
    console.error("Error checking if property is liked:", error)
    return false
  }

  return !!data
}

export async function searchProperties(query: string, filters?: SearchFilters) {
  let searchQuery = supabase
    .from("properties")
    .select(`
      *,
      categories (*),
      property_images (*),
      property_ratings (*)
    `)
    .eq("status", "active")

  // Apply text search
  if (query) {
    searchQuery = searchQuery.or(
      `title.ilike.%${query}%,description.ilike.%${query}%,location.ilike.%${query}%,area.ilike.%${query}%`
    )
  }

  // Apply filters
  if (filters?.category) {
    searchQuery = searchQuery.eq("category_id", filters.category)
  }

  if (filters?.minPrice) {
    searchQuery = searchQuery.gte("price", filters.minPrice)
  }

  if (filters?.maxPrice) {
    searchQuery = searchQuery.lte("price", filters.maxPrice)
  }

  if (filters?.bedrooms) {
    searchQuery = searchQuery.eq("bedrooms", filters.bedrooms)
  }

  if (filters?.bathrooms) {
    searchQuery = searchQuery.eq("bathrooms", filters.bathrooms)
  }

  if (filters?.location) {
    searchQuery = searchQuery.or(`location.ilike.%${filters.location}%,area.ilike.%${filters.location}%`)
  }

  if (filters?.propertyType) {
    searchQuery = searchQuery.eq("property_type", filters.propertyType)
  }

  if (filters?.ownerType) {
    searchQuery = searchQuery.eq("owner_type", filters.ownerType)
  }

  if (filters?.minSize) {
    searchQuery = searchQuery.gte("size", filters.minSize)
  }

  if (filters?.maxSize) {
    searchQuery = searchQuery.lte("size", filters.maxSize)
  }

  if (filters?.amenities && filters.amenities.length > 0) {
    searchQuery = searchQuery.contains("amenities", filters.amenities)
  }

  if (filters?.features && filters.features.length > 0) {
    searchQuery = searchQuery.contains("features", filters.features)
  }

  if (filters?.area) {
    searchQuery = searchQuery.ilike("area", `%${filters.area}%`)
  }

  if (filters?.isNew !== undefined) {
    searchQuery = searchQuery.eq("is_new", filters.isNew)
  }

  if (filters?.isFeatured !== undefined) {
    searchQuery = searchQuery.eq("is_featured", filters.isFeatured)
  }

  if (filters?.isVerified !== undefined) {
    searchQuery = searchQuery.eq("is_verified", filters.isVerified)
  }

  if (filters?.minPricePerMeter) {
    searchQuery = searchQuery.gte("price_per_meter", filters.minPricePerMeter)
  }

  if (filters?.maxPricePerMeter) {
    searchQuery = searchQuery.lte("price_per_meter", filters.maxPricePerMeter)
  }

  if (filters?.floor) {
    searchQuery = searchQuery.eq("floor", filters.floor)
  }

  if (filters?.yearBuilt) {
    searchQuery = searchQuery.eq("year_built", filters.yearBuilt)
  }

  searchQuery = searchQuery.order("created_at", { ascending: false })

  const { data, error } = await searchQuery

  if (error) {
    console.error("Error searching properties:", error)
    return []
  }

  // Sort property images for each property
  data.forEach(property => {
    if (property.property_images) {
      property.property_images.sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
    }
  })

  return data as PropertyWithDetails[]
}
