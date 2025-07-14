"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Category form validation schema
const CategoryFormSchema = z.object({
  name: z.string().min(1, "Name is required").max(255, "Name is too long"),
  description: z.string().optional(),
  icon: z.string().optional(),
  orderIndex: z.coerce.number().min(0, "Order must be 0 or greater").default(0),
})

type CategoryFormData = z.infer<typeof CategoryFormSchema>

export interface CategoryActionState {
  errors?: Partial<Record<keyof CategoryFormData, string[]>>
  message?: string
  success?: boolean
}

// Helper function to generate slug from name
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w\s-]/g, "") // Remove special characters except spaces and hyphens
    .replace(/[\s_-]+/g, "-") // Replace spaces, underscores, and multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, "") // Remove leading and trailing hyphens
}

export async function createCategory(
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
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
      icon: formData.get("icon") as string,
      orderIndex: formData.get("orderIndex") as string,
    }

    // Validate the form data
    const validatedFields = CategoryFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data
    const slug = generateSlug(data.name)

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existingCategory) {
      return {
        errors: { name: ["A category with this name already exists"] },
        message: "Category name must be unique",
        success: false,
      }
    }

    // If no orderIndex provided, set it to be the last
    let finalOrderIndex = data.orderIndex
    if (!formData.get("orderIndex")) {
      const { data: categories } = await supabase
        .from("categories")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1)

      finalOrderIndex = categories && categories.length > 0 ? (categories[0].order_index || 0) + 1 : 0
    }

    // Insert category into database
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name: data.name,
        slug: slug,
        description: data.description || null,
        icon: data.icon || null,
        order_index: finalOrderIndex,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating category:", error)
      return {
        message: "Failed to create category. Please try again.",
        success: false,
      }
    }

    revalidatePath("/admin/categories")
    return {
      message: "Category created successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in createCategory:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}

export async function updateCategory(
  id: string,
  prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
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
      icon: formData.get("icon") as string,
      orderIndex: formData.get("orderIndex") as string,
    }

    const validatedFields = CategoryFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data
    const slug = generateSlug(data.name)

    // Check if slug already exists for other categories
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .single()

    if (existingCategory) {
      return {
        errors: { name: ["A category with this name already exists"] },
        message: "Category name must be unique",
        success: false,
      }
    }

    // Update category in database
    const { error } = await supabase
      .from("categories")
      .update({
        name: data.name,
        slug: slug,
        description: data.description || null,
        icon: data.icon || null,
        order_index: data.orderIndex,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating category:", error)
      return {
        message: "Failed to update category. Please try again.",
        success: false,
      }
    }

    revalidatePath("/admin/categories")
    return {
      message: "Category updated successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in updateCategory:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}

export async function deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
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

    // Check if category has properties associated with it
    const { data: properties } = await supabase
      .from("properties")
      .select("id")
      .eq("category_id", id)
      .limit(1)

    if (properties && properties.length > 0) {
      return {
        success: false,
        message: "Cannot delete category that has properties associated with it. Please move or delete the properties first.",
      }
    }

    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return { success: false, message: "Failed to delete category" }
    }

    revalidatePath("/admin/categories")
    return { success: true, message: "Category deleted successfully" }
  } catch (error) {
    console.error("Error in deleteCategory:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function updateCategoriesOrder(categories: { id: string; order_index: number }[]): Promise<{ success: boolean; message: string }> {
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

    // Update each category's order
    for (const category of categories) {
      const { error } = await supabase
        .from("categories")
        .update({ 
          order_index: category.order_index,
          updated_at: new Date().toISOString(),
        })
        .eq("id", category.id)

      if (error) {
        console.error("Error updating category order:", error)
        return { success: false, message: "Failed to update category order" }
      }
    }

    revalidatePath("/admin/categories")
    return { success: true, message: "Category order updated successfully" }
  } catch (error) {
    console.error("Error in updateCategoriesOrder:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
} 