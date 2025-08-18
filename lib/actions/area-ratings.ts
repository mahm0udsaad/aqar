"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies, headers } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Helper to normalize optional numeric fields: drop invalid/out-of-range values entirely
const optionalRating = z
  .preprocess((v) => {
    if (v === null || v === '' || v === 'NaN' || v === undefined) return undefined
    const n = typeof v === 'number' ? v : Number(String(v).trim())
    if (!Number.isFinite(n)) return undefined
    if (n < 1 || n > 5) return undefined
    return n
  }, z.number())
  .optional()

// Area rating form validation schema
const AreaRatingSchema = z.object({
  areaId: z.string().uuid("Invalid area ID"),
  overallRating: z
    .coerce
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5")
    .refine((n) => Number.isFinite(n), { message: "Invalid rating value" }),
  schoolsRating: optionalRating,
  transportationRating: optionalRating,
  shoppingRating: optionalRating,
  restaurantsRating: optionalRating,
  safetyRating: optionalRating,
  quietnessRating: optionalRating,
  walkabilityRating: optionalRating,
  nightlifeRating: optionalRating,
  healthcareRating: optionalRating,
  parksRating: optionalRating,
  comment: z.preprocess((v) => (v === null || v === '' ? undefined : v), z.string().max(1000, "Comment too long").optional()),
})

export type AreaRatingFormData = z.infer<typeof AreaRatingSchema>

export interface AreaRatingActionState {
  errors?: {
    areaId?: string[]
    overallRating?: string[]
    schoolsRating?: string[]
    transportationRating?: string[]
    shoppingRating?: string[]
    restaurantsRating?: string[]
    safetyRating?: string[]
    quietnessRating?: string[]
    walkabilityRating?: string[]
    nightlifeRating?: string[]
    healthcareRating?: string[]
    parksRating?: string[]
    comment?: string[]
    _form?: string[]
  }
  message?: string
  success?: boolean
}

// Create or update area rating
export async function createOrUpdateAreaRating(
  prevState: AreaRatingActionState,
  formData: FormData
): Promise<AreaRatingActionState> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    // Get client IP for anonymous users
    const hdrs = await headers()
    const forwardedFor = hdrs.get('x-forwarded-for')
    const realIp = hdrs.get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

    // Coercion helpers to sanitize incoming FormData
    const coerceOptional = (v: FormDataEntryValue | null) => {
      if (v === null || v === undefined) return undefined
      const s = typeof v === 'string' ? v.trim() : String(v)
      if (s === '' || s === 'NaN') return undefined
      const n = Number(s)
      if (!Number.isFinite(n)) return undefined
      if (n < 1 || n > 5) return undefined
      return n
    }

    const coerceRequired = (v: FormDataEntryValue | null) => {
      const s = typeof v === 'string' ? v.trim() : String(v)
      const n = Number(s)
      return n
    }

    // Validate form data
    const validatedFields = AreaRatingSchema.safeParse({
      areaId: formData.get("areaId"),
      overallRating: coerceRequired(formData.get("overallRating")),
      schoolsRating: coerceOptional(formData.get("schoolsRating")),
      transportationRating: coerceOptional(formData.get("transportationRating")),
      shoppingRating: coerceOptional(formData.get("shoppingRating")),
      restaurantsRating: coerceOptional(formData.get("restaurantsRating")),
      safetyRating: coerceOptional(formData.get("safetyRating")),
      quietnessRating: coerceOptional(formData.get("quietnessRating")),
      walkabilityRating: coerceOptional(formData.get("walkabilityRating")),
      nightlifeRating: coerceOptional(formData.get("nightlifeRating")),
      healthcareRating: coerceOptional(formData.get("healthcareRating")),
      parksRating: coerceOptional(formData.get("parksRating")),
      comment: formData.get("comment"),
    })

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Invalid form data. Please check your inputs.",
      }
    }

    const data = validatedFields.data

    // Prepare rating data
    const ratingData = {
      area_id: data.areaId,
      user_id: user?.id || null,
      overall_rating: data.overallRating,
      schools_rating: data.schoolsRating || null,
      transportation_rating: data.transportationRating || null,
      shopping_rating: data.shoppingRating || null,
      restaurants_rating: data.restaurantsRating || null,
      safety_rating: data.safetyRating || null,
      quietness_rating: data.quietnessRating || null,
      walkability_rating: data.walkabilityRating || null,
      nightlife_rating: data.nightlifeRating || null,
      healthcare_rating: data.healthcareRating || null,
      parks_rating: data.parksRating || null,
      comment: data.comment || null,
      ip_address: !user ? ipAddress : null,
    }

    // Check if a rating already exists for this user/IP
    let existingRatingId: string | null = null
    if (user) {
      const { data: existing } = await supabase
        .from("area_ratings")
        .select("id")
        .eq("area_id", data.areaId)
        .eq("user_id", user.id)
        .single()
      existingRatingId = existing?.id ?? null
    } else if (ipAddress) {
      const { data: existing } = await supabase
        .from("area_ratings")
        .select("id")
        .eq("area_id", data.areaId)
        .eq("ip_address", ipAddress)
        .is("user_id", null)
        .single()
      existingRatingId = existing?.id ?? null
    }

    let dbError: any = null

    if (existingRatingId) {
      if (user) {
        // Authenticated users can update their own ratings (allowed by RLS)
        const { error } = await supabase
          .from("area_ratings")
          .update(ratingData)
          .eq("id", existingRatingId)
        dbError = error
      } else {
        // Anonymous users cannot update due to RLS; show friendly message
        return {
          errors: {
            _form: ["You have already rated this area. Sign in to update your rating."],
          },
          success: false,
        }
      }
    } else {
      // Create new rating
      const { error } = await supabase
        .from("area_ratings")
        .insert([ratingData])
      dbError = error
    }

    if (dbError) {
      console.error("Database error:", dbError)
      return {
        errors: {
          _form: ["Failed to save rating. Please try again."],
        },
      }
    }

    revalidatePath("/")
    return {
      message: existingRatingId ? "Rating updated successfully!" : "Rating submitted successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in createOrUpdateAreaRating:", error)
    return {
      errors: {
        _form: ["An unexpected error occurred. Please try again."],
      },
    }
  }
}

// Get area ratings summary
export async function getAreaRatingsSummary(areaId: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data, error } = await supabase
      .from("area_ratings_summary")
      .select("*")
      .eq("area_id", areaId)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("Error fetching area ratings summary:", error)
      return null
    }

    return data
  } catch (error) {
    console.error("Error in getAreaRatingsSummary:", error)
    return null
  }
}

// Get user's rating for an area
export async function getUserAreaRating(areaId: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      // For anonymous users, check by IP
      const hdrs2 = await headers()
      const forwardedFor = hdrs2.get('x-forwarded-for')
      const realIp = hdrs2.get('x-real-ip')
      const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null
      
      if (!ipAddress) return null
      
      const { data, error } = await supabase
        .from("area_ratings")
        .select("*")
        .eq("area_id", areaId)
        .eq("ip_address", ipAddress)
        .is("user_id", null)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user area rating:", error)
        return null
      }
      
      return data
    } else {
      // For authenticated users
      const { data, error } = await supabase
        .from("area_ratings")
        .select("*")
        .eq("area_id", areaId)
        .eq("user_id", user.id)
        .single()
        
      if (error && error.code !== 'PGRST116') {
        console.error("Error fetching user area rating:", error)
        return null
      }
      
      return data
    }
  } catch (error) {
    console.error("Error in getUserAreaRating:", error)
    return null
  }
}

// Get all ratings for an area (for detailed view)
export async function getAreaRatings(areaId: string, limit = 10, offset = 0) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data, error } = await supabase
      .from("area_ratings")
      .select("*")
      .eq("area_id", areaId)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error("Error fetching area ratings:", error)
      return []
    }

    return data || []
  } catch (error) {
    console.error("Error in getAreaRatings:", error)
    return []
  }
}

// Delete area rating (for authenticated users only)
export async function deleteAreaRating(ratingId: string): Promise<AreaRatingActionState> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return {
        errors: {
          _form: ["You must be logged in to delete a rating."],
        },
      }
    }

    const { error } = await supabase
      .from("area_ratings")
      .delete()
      .eq("id", ratingId)
      .eq("user_id", user.id) // Ensure user can only delete their own rating

    if (error) {
      console.error("Database error:", error)
      return {
        errors: {
          _form: ["Failed to delete rating. Please try again."],
        },
      }
    }

    revalidatePath("/")
    return {
      message: "Rating deleted successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in deleteAreaRating:", error)
    return {
      errors: {
        _form: ["An unexpected error occurred. Please try again."],
      },
    }
  }
} 