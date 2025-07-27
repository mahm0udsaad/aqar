"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Area rating form validation schema
const AreaRatingSchema = z.object({
  areaId: z.string().uuid("Invalid area ID"),
  overallRating: z.coerce.number().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  schoolsRating: z.coerce.number().min(1).max(5).optional(),
  transportationRating: z.coerce.number().min(1).max(5).optional(),
  shoppingRating: z.coerce.number().min(1).max(5).optional(),
  restaurantsRating: z.coerce.number().min(1).max(5).optional(),
  safetyRating: z.coerce.number().min(1).max(5).optional(),
  quietnessRating: z.coerce.number().min(1).max(5).optional(),
  walkabilityRating: z.coerce.number().min(1).max(5).optional(),
  nightlifeRating: z.coerce.number().min(1).max(5).optional(),
  healthcareRating: z.coerce.number().min(1).max(5).optional(),
  parksRating: z.coerce.number().min(1).max(5).optional(),
  comment: z.string().max(1000, "Comment too long").optional(),
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
    const forwardedFor = (await import('next/headers')).headers().get('x-forwarded-for')
    const realIp = (await import('next/headers')).headers().get('x-real-ip')
    const ipAddress = forwardedFor?.split(',')[0]?.trim() || realIp || null

    // Validate form data
    const validatedFields = AreaRatingSchema.safeParse({
      areaId: formData.get("areaId"),
      overallRating: formData.get("overallRating"),
      schoolsRating: formData.get("schoolsRating"),
      transportationRating: formData.get("transportationRating"),
      shoppingRating: formData.get("shoppingRating"),
      restaurantsRating: formData.get("restaurantsRating"),
      safetyRating: formData.get("safetyRating"),
      quietnessRating: formData.get("quietnessRating"),
      walkabilityRating: formData.get("walkabilityRating"),
      nightlifeRating: formData.get("nightlifeRating"),
      healthcareRating: formData.get("healthcareRating"),
      parksRating: formData.get("parksRating"),
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

    // Check if user already has a rating for this area
    const { data: existingRating } = await supabase
      .from("area_ratings")
      .select("id")
      .eq("area_id", data.areaId)
      .eq(user ? "user_id" : "ip_address", user?.id || ipAddress)
      .single()

    let result
    if (existingRating) {
      // Update existing rating
      result = await supabase
        .from("area_ratings")
        .update(ratingData)
        .eq("id", existingRating.id)
        .select()
        .single()
    } else {
      // Create new rating
      result = await supabase
        .from("area_ratings")
        .insert([ratingData])
        .select()
        .single()
    }

    if (result.error) {
      console.error("Database error:", result.error)
      return {
        errors: {
          _form: ["Failed to save rating. Please try again."],
        },
      }
    }

    revalidatePath("/")
    return {
      message: existingRating ? "Rating updated successfully!" : "Rating submitted successfully!",
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
      const forwardedFor = (await import('next/headers')).headers().get('x-forwarded-for')
      const realIp = (await import('next/headers')).headers().get('x-real-ip')
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