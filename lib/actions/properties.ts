"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"

// Helper function to upload image to Supabase Storage
async function uploadImageToStorage(file: File, propertyId: string, index: number): Promise<string | null> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Generate unique filename
    const fileExt = file.name.split('.').pop()
    const fileName = `${propertyId}_${index}_${Date.now()}.${fileExt}`
    const filePath = `properties/${fileName}`

    // Upload file to storage
    const { error: uploadError } = await supabase.storage
      .from('property-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('property-images')
      .getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error('Error uploading image:', error)
    return null
  }
}

// Helper function to delete image from storage
async function deleteImageFromStorage(url: string): Promise<void> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Extract file path from URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const filePath = `properties/${fileName}`

    await supabase.storage
      .from('property-images')
      .remove([filePath])
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}

// Property form validation schema
const PropertyFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  description: z.string().min(1, "Description is required"),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  pricePerMeter: z.coerce.number().optional(),
  location: z.string().min(1, "Location is required"),
  area: z.string().min(1, "Area is required"),
  bedrooms: z.coerce.number().min(0, "Bedrooms must be 0 or greater"),
  bathrooms: z.coerce.number().min(0, "Bathrooms must be 0 or greater"),
  size: z.coerce.number().min(1, "Size must be greater than 0"),
  floor: z.coerce.number().optional(),
  totalFloors: z.coerce.number().optional(),
  yearBuilt: z.coerce.number().optional(),
  categoryId: z.string().min(1, "Category is required"),
  propertyType: z.enum(["sale", "rent"]),
  ownerType: z.enum(["owner", "broker"]).default("owner"),
  status: z.enum(["active", "draft", "sold", "rented", "inactive"]).default("active"),
  features: z.array(z.string()).default([]),
  amenities: z.array(z.string()).default([]),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
  isVerified: z.boolean().default(false),
  contactName: z.string().min(1, "Contact name is required"),
  contactPhone: z.string().min(1, "Contact phone is required"),
  contactWhatsapp: z.string().optional(),
  contactEmail: z.string().email("Invalid email").optional(),
  responseTime: z.string().default("1 hour"),
})

type PropertyFormData = z.infer<typeof PropertyFormSchema>

export interface PropertyActionState {
  errors?: Partial<Record<keyof PropertyFormData, string[]>>
  message?: string
  success?: boolean
}

export async function createProperty(
  prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
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
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      pricePerMeter: formData.get("pricePerMeter") as string,
      location: formData.get("location") as string,
      area: formData.get("area") as string,
      bedrooms: formData.get("bedrooms") as string,
      bathrooms: formData.get("bathrooms") as string,
      size: formData.get("size") as string,
      floor: formData.get("floor") as string,
      totalFloors: formData.get("totalFloors") as string,
      yearBuilt: formData.get("yearBuilt") as string,
      categoryId: formData.get("categoryId") as string,
      propertyType: formData.get("propertyType") as "sale" | "rent",
      ownerType: formData.get("ownerType") as "owner" | "broker",
      status: formData.get("status") as "active" | "draft" | "sold" | "rented" | "inactive",
      features: formData.getAll("features") as string[],
      amenities: formData.getAll("amenities") as string[],
      isNew: formData.get("isNew") === "true",
      isFeatured: formData.get("isFeatured") === "true",
      isVerified: formData.get("isVerified") === "true",
      contactName: formData.get("contactName") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactWhatsapp: formData.get("contactWhatsapp") as string,
      contactEmail: formData.get("contactEmail") as string,
      responseTime: formData.get("responseTime") as string,
    }

    // Validate the form data
    const validatedFields = PropertyFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data

    // Calculate price per meter if not provided
    const pricePerMeter = data.pricePerMeter || data.price / data.size

    // Insert property into database
    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        title: data.title,
        description: data.description,
        price: data.price,
        price_per_meter: pricePerMeter,
        location: data.location,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size,
        floor: data.floor,
        total_floors: data.totalFloors,
        year_built: data.yearBuilt,
        category_id: data.categoryId,
        property_type: data.propertyType,
        owner_type: data.ownerType,
        status: data.status,
        features: data.features,
        amenities: data.amenities,
        is_new: data.isNew,
        is_featured: data.isFeatured,
        is_verified: data.isVerified,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_whatsapp: data.contactWhatsapp,
        contact_email: data.contactEmail,
        response_time: data.responseTime,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating property:", error)
      return {
        message: "Failed to create property. Please try again.",
        success: false,
      }
    }

    // Handle image uploads
    const totalImages = parseInt(formData.get("total_images") as string) || 0
    
    if (totalImages > 0) {
      const imageUploads = []
      
      for (let i = 0; i < totalImages; i++) {
        const imageFile = formData.get(`image_${i}`) as File
        const altText = formData.get(`image_${i}_alt`) as string
        const orderIndex = parseInt(formData.get(`image_${i}_order`) as string) || i
        const isMain = formData.get(`image_${i}_is_main`) === "true"
        
        if (imageFile && imageFile.size > 0) {
          // Upload image to storage
          const imageUrl = await uploadImageToStorage(imageFile, property.id, i)
          
          if (imageUrl) {
            // Insert into property_images table
            const imageInsert = supabase
              .from("property_images")
              .insert({
                property_id: property.id,
                url: imageUrl,
                alt_text: altText || null,
                order_index: orderIndex,
                is_main: isMain
              })
            
            imageUploads.push(imageInsert)
          }
        }
      }
      
      // Execute all image uploads
      if (imageUploads.length > 0) {
        const results = await Promise.all(imageUploads)
        const hasErrors = results.some(result => result.error)
        
        if (hasErrors) {
          console.error("Some images failed to upload")
          // Continue anyway, don't fail the entire operation
        }
      }
    }

    revalidatePath("/admin/properties")
    return {
      message: "Property created successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in createProperty:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}

export async function updateProperty(
  id: string,
  prevState: PropertyActionState,
  formData: FormData
): Promise<PropertyActionState> {
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

    // Extract and validate form data (same as create)
    const rawFormData = {
      title: formData.get("title") as string,
      description: formData.get("description") as string,
      price: formData.get("price") as string,
      pricePerMeter: formData.get("pricePerMeter") as string,
      location: formData.get("location") as string,
      area: formData.get("area") as string,
      bedrooms: formData.get("bedrooms") as string,
      bathrooms: formData.get("bathrooms") as string,
      size: formData.get("size") as string,
      floor: formData.get("floor") as string,
      totalFloors: formData.get("totalFloors") as string,
      yearBuilt: formData.get("yearBuilt") as string,
      categoryId: formData.get("categoryId") as string,
      propertyType: formData.get("propertyType") as "sale" | "rent",
      ownerType: formData.get("ownerType") as "owner" | "broker",
      status: formData.get("status") as "active" | "draft" | "sold" | "rented" | "inactive",
      features: formData.getAll("features") as string[],
      amenities: formData.getAll("amenities") as string[],
      isNew: formData.get("isNew") === "true",
      isFeatured: formData.get("isFeatured") === "true",
      isVerified: formData.get("isVerified") === "true",
      contactName: formData.get("contactName") as string,
      contactPhone: formData.get("contactPhone") as string,
      contactWhatsapp: formData.get("contactWhatsapp") as string,
      contactEmail: formData.get("contactEmail") as string,
      responseTime: formData.get("responseTime") as string,
    }

    const validatedFields = PropertyFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data
    const pricePerMeter = data.pricePerMeter || data.price / data.size

    // Update property in database
    const { error } = await supabase
      .from("properties")
      .update({
        title: data.title,
        description: data.description,
        price: data.price,
        price_per_meter: pricePerMeter,
        location: data.location,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        size: data.size,
        floor: data.floor,
        total_floors: data.totalFloors,
        year_built: data.yearBuilt,
        category_id: data.categoryId,
        property_type: data.propertyType,
        owner_type: data.ownerType,
        status: data.status,
        features: data.features,
        amenities: data.amenities,
        is_new: data.isNew,
        is_featured: data.isFeatured,
        is_verified: data.isVerified,
        contact_name: data.contactName,
        contact_phone: data.contactPhone,
        contact_whatsapp: data.contactWhatsapp,
        contact_email: data.contactEmail,
        response_time: data.responseTime,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)

    if (error) {
      console.error("Error updating property:", error)
      return {
        message: "Failed to update property. Please try again.",
        success: false,
      }
    }

    // Handle image updates
    const totalImages = parseInt(formData.get("total_images") as string) || 0
    
    if (totalImages > 0) {
      // Get current images to compare
      const { data: currentImages } = await supabase
        .from("property_images")
        .select("*")
        .eq("property_id", id)
      
      // Track which existing images are still being used
      const existingImageIds = new Set<string>()
      const imageOperations = []
      
      for (let i = 0; i < totalImages; i++) {
        const imageFile = formData.get(`image_${i}`) as File
        const existingImageId = formData.get(`existing_image_${i}_id`) as string
        const altText = (formData.get(`image_${i}_alt`) || formData.get(`existing_image_${i}_alt`)) as string
        const orderIndex = parseInt((formData.get(`image_${i}_order`) || formData.get(`existing_image_${i}_order`)) as string) || i
        const isMain = ((formData.get(`image_${i}_is_main`) || formData.get(`existing_image_${i}_is_main`)) as string) === "true"
        
        if (imageFile && imageFile.size > 0) {
          // New image upload
          const imageUrl = await uploadImageToStorage(imageFile, id, i)
          
          if (imageUrl) {
            const imageInsert = supabase
              .from("property_images")
              .insert({
                property_id: id,
                url: imageUrl,
                alt_text: altText || null,
                order_index: orderIndex,
                is_main: isMain
              })
            
            imageOperations.push(imageInsert)
          }
        } else if (existingImageId) {
          // Update existing image metadata
          existingImageIds.add(existingImageId)
          
          const imageUpdate = supabase
            .from("property_images")
            .update({
              alt_text: altText || null,
              order_index: orderIndex,
              is_main: isMain
            })
            .eq("id", existingImageId)
          
          imageOperations.push(imageUpdate)
        }
      }
      
      // Delete images that are no longer referenced
      if (currentImages) {
        for (const image of currentImages) {
          if (!existingImageIds.has(image.id)) {
            // Delete from storage
            await deleteImageFromStorage(image.url)
            
            // Delete from database
            const imageDelete = supabase
              .from("property_images")
              .delete()
              .eq("id", image.id)
            
            imageOperations.push(imageDelete)
          }
        }
      }
      
      // Execute all image operations
      if (imageOperations.length > 0) {
        const results = await Promise.all(imageOperations)
        const hasErrors = results.some(result => result.error)
        
        if (hasErrors) {
          console.error("Some image operations failed")
          // Continue anyway, don't fail the entire operation
        }
      }
    }

    revalidatePath("/admin/properties")
    revalidatePath(`/admin/properties/${id}/edit`)
    return {
      message: "Property updated successfully!",
      success: true,
    }
  } catch (error) {
    console.error("Error in updateProperty:", error)
    return {
      message: "An unexpected error occurred. Please try again.",
      success: false,
    }
  }
}

export async function deleteProperty(id: string): Promise<{ success: boolean; message: string }> {
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

    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) {
      console.error("Error deleting property:", error)
      return { success: false, message: "Failed to delete property" }
    }

    revalidatePath("/admin/properties")
    return { success: true, message: "Property deleted successfully" }
  } catch (error) {
    console.error("Error in deleteProperty:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}

export async function togglePropertyFeatured(id: string, featured: boolean): Promise<{ success: boolean; message: string }> {
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

    const { error } = await supabase
      .from("properties")
      .update({ is_featured: featured, updated_at: new Date().toISOString() })
      .eq("id", id)

    if (error) {
      console.error("Error toggling property featured status:", error)
      return { success: false, message: "Failed to update property" }
    }

    revalidatePath("/admin/properties")
    revalidatePath("/admin/featured")
    return { success: true, message: `Property ${featured ? "featured" : "unfeatured"} successfully` }
  } catch (error) {
    console.error("Error in togglePropertyFeatured:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
} 