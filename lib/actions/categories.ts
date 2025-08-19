"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Helper function to upload category image to Supabase Storage
async function uploadCategoryImageToStorage(file: File, categoryId: string): Promise<string | null> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${categoryId}_${Date.now()}.${fileExt}`;
    const filePath = `categories/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('category_images') // Assuming a bucket named 'category_images'
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      console.error('Category image upload error:', uploadError);
      return null;
    }

    const { data: { publicUrl } } = supabase.storage
      .from('category_images')
      .getPublicUrl(filePath);

    return publicUrl;
  } catch (error) {
    console.error('Error uploading category image:', error);
    return null;
  }
}

// Helper function to delete category image from Supabase Storage
async function deleteCategoryImageFromStorage(url: string): Promise<void> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    const filePath = `categories/${fileName}`;

    await supabase.storage
      .from('category_images')
      .remove([filePath]);
  } catch (error) {
    console.error('Error deleting category image:', error);
  }
}

// Category form validation schema
const CategoryFormSchema = z.object({
  name_en: z.string().min(1, "English name is required").max(255, "English name is too long"),
  name_ar: z.string().min(1, "Arabic name is required").max(255, "Arabic name is too long"),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { message: "Admin access required", success: false }
    }

    // Extract and validate form data
    const rawFormData = {
      name_en: formData.get("name_en") as string,
      name_ar: formData.get("name_ar") as string,
      description_en: formData.get("description_en") as string,
      description_ar: formData.get("description_ar") as string,
      icon: formData.get("icon") as string,
      orderIndex: formData.get("orderIndex") as string,
      imageFile: formData.get("image") as File, // Get the image file
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
    const slug = generateSlug(data.name_en)

    // Check if slug already exists
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .single()

    if (existingCategory) {
      return {
        errors: { name_en: ["A category with this name already exists"] },
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
        name: data.name_en, // Keep backward compatibility
        slug: slug,
        description: data.description_en || null, // Keep backward compatibility
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en || null,
        description_ar: data.description_ar || null,
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

    // Handle image upload if present
    let imageUrl: string | null = null;
    if (rawFormData.imageFile && rawFormData.imageFile.size > 0) {
      imageUrl = await uploadCategoryImageToStorage(rawFormData.imageFile, category.id);
      if (imageUrl) {
        await supabase.from("categories").update({ image_url: imageUrl }).eq("id", category.id);
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { message: "Admin access required", success: false }
    }

    // Get existing category data first
    const { data: existingCategoryData } = await supabase
      .from("categories")
      .select("image_url")
      .eq("id", id)
      .single()

    // Extract and validate form data
    const rawFormData = {
      name_en: formData.get("name_en") as string,
      name_ar: formData.get("name_ar") as string,
      description_en: formData.get("description_en") as string,
      description_ar: formData.get("description_ar") as string,
      icon: formData.get("icon") as string,
      orderIndex: formData.get("orderIndex") as string,
      imageFile: formData.get("image") as File, // Get the image file
      existingImageUrl: formData.get("image_url") as string, // Get existing image URL
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
    const slug = generateSlug(data.name_en)

    // Check if slug already exists for other categories
    const { data: existingCategory } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", slug)
      .neq("id", id)
      .single()

    if (existingCategory) {
      return {
        errors: { name_en: ["A category with this name already exists"] },
        message: "Category name must be unique",
        success: false,
      }
    }

    let imageUrlToSave: string | null = rawFormData.existingImageUrl || null;

    // Handle image upload/removal
    if (rawFormData.imageFile && rawFormData.imageFile.size > 0) {
      // New image uploaded, delete old one if exists
      if (existingCategoryData?.image_url) {
        await deleteCategoryImageFromStorage(existingCategoryData.image_url);
      }
      imageUrlToSave = await uploadCategoryImageToStorage(rawFormData.imageFile, id);
    } else if (rawFormData.existingImageUrl === "" && existingCategoryData?.image_url) {
      // Image was removed
      await deleteCategoryImageFromStorage(existingCategoryData.image_url);
      imageUrlToSave = null;
    }

    // Update category in database
    const { error } = await supabase
      .from("categories")
      .update({
        name: data.name_en, // Keep backward compatibility
        slug: slug,
        description: data.description_en || null, // Keep backward compatibility
        name_en: data.name_en,
        name_ar: data.name_ar,
        description_en: data.description_en || null,
        description_ar: data.description_ar || null,
        icon: data.icon || null,
        order_index: data.orderIndex,
        image_url: imageUrlToSave, // Save the new/updated image URL
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
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

    // Get category data before deletion to clean up image
    const { data: categoryData } = await supabase
      .from("categories")
      .select("image_url")
      .eq("id", id)
      .single()

    // Delete the category
    const { error } = await supabase.from("categories").delete().eq("id", id)

    if (error) {
      console.error("Error deleting category:", error)
      return { success: false, message: "Failed to delete category" }
    }

    // Clean up associated image if exists
    if (categoryData?.image_url) {
      await deleteCategoryImageFromStorage(categoryData.image_url)
    }

    revalidatePath("/admin/categories")
    return { success: true, message: "Category deleted successfully" }
  } catch (error) {
    console.error("Error in deleteCategory:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

// Fixed updateCategoriesOrder function with better error handling and transaction-like behavior
export async function updateCategoriesOrder(
  categories: { id: string; order_index: number }[]
): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })

    // Validate input
    if (!categories || categories.length === 0) {
      return { success: false, message: "No categories provided" }
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { success: false, message: "Admin access required" }
    }

    // Validate that all categories exist before updating
    const categoryIds = categories.map(cat => cat.id)
    const { data: existingCategories, error: fetchError } = await supabase
      .from("categories")
      .select("id")
      .in("id", categoryIds)

    if (fetchError) {
      console.error("Error fetching categories:", fetchError)
      return { success: false, message: "Failed to validate categories" }
    }

    if (!existingCategories || existingCategories.length !== categories.length) {
      return { success: false, message: "Some categories not found" }
    }

    // Use a single RPC call or batch update for better performance and atomicity
    const updates = categories.map(category => ({
      id: category.id,
      order_index: category.order_index,
      updated_at: new Date().toISOString(),
    }))

    // Perform all updates
    const updatePromises = updates.map(update =>
      supabase
        .from("categories")
        .update({
          order_index: update.order_index,
          updated_at: update.updated_at,
        })
        .eq("id", update.id)
    )

    const results = await Promise.allSettled(updatePromises)
    
    // Check if any updates failed
    const failedUpdates = results.filter(result => 
      result.status === 'rejected' || 
      (result.status === 'fulfilled' && result.value.error)
    )

    if (failedUpdates.length > 0) {
      console.error("Some category updates failed:", failedUpdates)
      return { 
        success: false, 
        message: `Failed to update ${failedUpdates.length} categories` 
      }
    }

    revalidatePath("/admin/categories")
    return { success: true, message: "Category order updated successfully" }
  } catch (error) {
    console.error("Error in updateCategoriesOrder:", error)
    return { 
      success: false, 
      message: "An unexpected error occurred while updating category order" 
    }
  }
}