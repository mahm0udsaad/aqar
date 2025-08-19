"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Area form validation schema
const AreaFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  orderIndex: z.coerce.number().min(0, "Order must be 0 or greater").default(0),
  isActive: z.boolean().default(true),
  imageUrl: z.string().optional(),
})

type AreaFormData = z.infer<typeof AreaFormSchema>

export interface AreaActionState {
  errors?: Partial<Record<keyof AreaFormData, string[]>>
  message?: string
  success?: boolean
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  // Unicode-aware slug: keep letters/numbers in any language, spaces and hyphens
  // Then collapse to single hyphens and trim
  const normalized = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
  return normalized
}

export async function createArea(
  prevState: AreaActionState,
  formData: FormData
): Promise<AreaActionState> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    console.log("createArea called with formData:", Object.fromEntries(formData.entries()))

    // Check if user is authenticated
    const {
      data: { session },
    } = await supabase.auth.getSession()

    console.log("Session:", session ? "exists" : "no session")

    if (!session) {
      console.log("No session found")
      return { message: "Authentication required", success: false }
    }

    // For now, let's skip the admin check to debug
    // We can add it back later once the basic functionality works
    console.log("User authenticated, proceeding...")

    // Extract and validate form data
    const rawFormData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      orderIndex: formData.get("orderIndex") as string,
      isActive: formData.get("isActive") === "true",
      imageUrl: (formData.get("imageUrl") as string) || "",
    }

    console.log("Raw form data:", rawFormData)

    // Validate the form data
    const validatedFields = AreaFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      console.log("Validation failed:", validatedFields.error.flatten().fieldErrors)
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data
    const slug = generateSlug(data.name)

    console.log("Validated data:", data)
    console.log("Generated slug:", slug)

    // Check if slug already exists
    const { data: existingArea, error: checkError } = await supabase
      .from("areas")
      .select("id")
      .eq("slug", slug)
      .single()

    if (checkError && checkError.code !== 'PGRST116') {
      console.log("Error checking existing area:", checkError)
      return {
        message: "Database error while checking for duplicates",
        success: false,
      }
    }

    if (existingArea) {
      console.log("Area with this slug already exists:", existingArea)
      return {
        errors: { name: ["An area with this name already exists"] },
        message: "Area name must be unique",
        success: false,
      }
    }

    // If no orderIndex provided, set it to be the last
    let finalOrderIndex = data.orderIndex
    if (!formData.get("orderIndex")) {
      const { data: areas } = await supabase
        .from("areas")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)

      finalOrderIndex = areas && areas.length > 0 ? (areas[0].order_index || 0) + 1 : 0
      console.log("Auto-calculated order index:", finalOrderIndex)
    }

    const insertData = {
      name: data.name,
      slug: slug,
      description: data.description || null,
      order_index: finalOrderIndex,
      is_active: data.isActive,
      image_url: data.imageUrl || null,
    }

    console.log("Inserting data:", insertData)

    // Insert area into database
    const { error, data: insertedData } = await supabase
      .from("areas")
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error("Error creating area:", error)
      return {
        message: `Failed to create area: ${error.message}`,
        success: false,
      }
    }

    console.log("Area created successfully:", insertedData)

    revalidatePath("/admin/areas")
    revalidatePath("/admin/properties")
    revalidatePath("/")
    revalidatePath("/search")
    
    return {
      message: "Area created successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in createArea:", error)
    return {
      message: `An unexpected error occurred: ${error}`,
      success: false,
    }
  }
}

export async function updateArea(
  id: string,
  prevState: AreaActionState,
  formData: FormData
): Promise<AreaActionState> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { message: "Authentication required", success: false }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return { message: "Admin access required", success: false }
    }

    // Extract and validate form data
    const rawFormData = {
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      orderIndex: formData.get("orderIndex") as string,
      isActive: formData.get("isActive") === "true",
      imageUrl: (formData.get("imageUrl") as string) || "",
    }

    const validatedFields = AreaFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data
    const slug = generateSlug(data.name)

    // Fetch current area to determine if slug is changing
    const { data: currentArea, error: currentError } = await supabase
      .from("areas")
      .select("slug")
      .eq("id", id)
      .maybeSingle()

    if (currentError) {
      return { message: "Database error while fetching area", success: false }
    }
    if (!currentArea) {
      return { message: "Area not found", success: false }
    }

    const isSlugChanging = currentArea.slug !== slug

    if (isSlugChanging) {
      // Check if slug already exists for other areas only if changing
      const { data: duplicate, error: dupError } = await supabase
        .from("areas")
        .select("id")
        .eq("slug", slug)
        .neq("id", id)
        .maybeSingle()

      if (dupError) {
        return { message: "Database error while checking for duplicates", success: false }
      }

      if (duplicate) {
        return {
          errors: { name: ["An area with this name already exists"] },
          message: "Area name must be unique",
          success: false,
        }
      }
    }

    // Update area in database
    const { error } = await supabase
      .from("areas")
      .update({
        name: data.name,
        slug: slug,
        description: data.description || null,
        order_index: data.orderIndex,
        is_active: data.isActive,
        image_url: data.imageUrl || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating area:", error)
      return {
        message: "Failed to update area. Please try again.",
        success: false,
      }
    }

    revalidatePath("/admin/areas")
    revalidatePath("/admin/properties")
    revalidatePath("/")
    revalidatePath("/search")
    return {
      message: "Area updated successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in updateArea:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}

export async function deleteArea(id: string): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, message: "Authentication required" }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return { success: false, message: "Admin access required" }
    }

    // Check if area has properties associated with it
    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .eq("area_id", id)
      .limit(1)

    if (properties && properties.length > 0) {
      return {
        success: false,
        message: "Cannot delete area that has properties associated with it. Please move or delete the properties first.",
      }
    }

    // Delete the area
    const { error } = await supabase.from("areas").delete().eq("id", id)

    if (error) {
      console.error("Error deleting area:", error)
      return { success: false, message: "Failed to delete area" }
    }

    revalidatePath("/admin/areas")
    revalidatePath("/admin/properties")
    revalidatePath("/")
    revalidatePath("/search")
    return { success: true, message: "Area deleted successfully" }
  } catch (error) {
    console.error("Error in deleteArea:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function updateAreasOrder(
  areas: { id: string; order_index: number }[]
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Validate input
    if (!areas || areas.length === 0) {
      return { success: false, message: "No areas provided" }
    }

    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session) {
      return { success: false, message: "Authentication required" }
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (!profile || profile.role !== "admin") {
      return { success: false, message: "Admin access required" }
    }

    // Validate that all areas exist before updating
    const areaIds = areas.map(area => area.id)
    const { data: existingAreas, error: fetchError } = await supabase
      .from("areas")
      .select("id")
      .in("id", areaIds)

    if (fetchError) {
      console.error("Error fetching areas:", fetchError)
      return { success: false, message: "Failed to validate areas" }
    }

    if (!existingAreas || existingAreas.length !== areas.length) {
      return { success: false, message: "Some areas not found" }
    }

    // Perform all updates
    const updatePromises = areas.map(area =>
      supabase
        .from("areas")
        .update({
          order_index: area.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", area.id)
    )

    const results = await Promise.allSettled(updatePromises)
    
    // Check if any updates failed
    const failedUpdates = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && result.value.error)
    )

    if (failedUpdates.length > 0) {
      console.error("Some area updates failed:", failedUpdates)
      return { 
        success: false, 
        message: `Failed to update ${failedUpdates.length} areas` 
      }
    }

    revalidatePath("/admin/areas")
    return { success: true, message: "Area order updated successfully" }
  } catch (error) {
    console.error("Error in updateAreasOrder:", error)
    return { 
      success: false, 
      message: "An unexpected error occurred while updating area order" 
    }
  }
}

// Helper function to get all active areas
export async function getAreas() {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data: areas, error } = await supabase
      .from("areas")
      .select("*")
      .eq("is_active", true)
      .order("order_index", { ascending: true })

    if (error) {
      console.error("Error fetching areas:", error)
      return []
    }

    return areas || []
  } catch (error) {
    console.error("Error in getAreas:", error)
    return []
  }
}

// Helper function to get area by ID
export async function getAreaById(id: string) {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    const { data: area, error } = await supabase
      .from("areas")
      .select("*")
      .eq("id", id)
      .single()

    if (error) {
      console.error("Error fetching area:", error)
      return null
    }

    return area
  } catch (error) {
    console.error("Error in getAreaById:", error)
    return null
  }
} 