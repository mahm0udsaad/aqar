"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/lib/supabase/types"
import sharp from "sharp"



// Updated uploadImageToStorage function with thumbnail generation
async function uploadImageToStorage(
  imageFile: File, 
  propertyId: string, 
  index: number
): Promise<{ originalUrl: string; thumbnailUrl: string } | null> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });
    
    // Convert File to Buffer
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // Get file extension
    const fileExtension = imageFile.name.split('.').pop() || 'jpg';
    const fileName = `${propertyId}_${index}`;
    
    // Create original image (optimized but full-size)
    const optimizedBuffer = await sharp(buffer)
      .jpeg({ quality: 85, progressive: true })
      .resize(1920, 1080, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .toBuffer();
    
    // Create thumbnail (small, optimized for listing views)
    const thumbnailBuffer = await sharp(buffer)
      .jpeg({ quality: 80, progressive: true })
      .resize(400, 300, { 
        fit: 'cover',
        position: 'center'
      })
      .toBuffer();
    
    // Upload original image
    const originalPath = `properties/${fileName}.jpg`;
    const { error: originalError } = await supabase.storage
      .from('property-images')
      .upload(originalPath, optimizedBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (originalError) {
      console.error('Error uploading original image:', originalError);
      return null;
    }
    
    // Upload thumbnail
    const thumbnailPath = `properties/thumbnails/${fileName}_thumb.jpg`;
    const { error: thumbnailError } = await supabase.storage
      .from('property-images')
      .upload(thumbnailPath, thumbnailBuffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (thumbnailError) {
      console.error('Error uploading thumbnail:', thumbnailError);
      // Continue without thumbnail if it fails
    }
    
    // Get public URLs
    const { data: originalData } = supabase.storage
      .from('property-images')
      .getPublicUrl(originalPath);
    
    const { data: thumbnailData } = supabase.storage
      .from('property-images')
      .getPublicUrl(thumbnailPath);
    
    return {
      originalUrl: originalData.publicUrl,
      thumbnailUrl: thumbnailError ? originalData.publicUrl : thumbnailData.publicUrl
    };
    
  } catch (error) {
    console.error('Error in uploadImageToStorage:', error);
    return null;
  }
}

// Property form validation schema
const PropertyFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(500, "Title is too long"),
  title_en: z.string().optional(),
  title_ar: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  description_en: z.string().optional(),
  description_ar: z.string().optional(),
  price: z.coerce.number().min(0, "Price must be a positive number"),
  pricePerMeter: z.coerce.number().optional(),
  location: z.string().min(1, "Location is required"),
  location_en: z.string().optional(),
  location_ar: z.string().optional(),
  area: z.string().min(1, "Area is required"),
  areaId: z.string().min(1, "Area selection is required"),
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
  locationIframeUrl: z.string().optional().nullable(),
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { message: "Admin access required", success: false }
    }

    // Extract and validate form data
    const rawFormData = {
      title: formData.get("title") as string,
      titleEn: (formData.get("title_en") as string) || "",
      titleAr: (formData.get("title_ar") as string) || "",
      description: formData.get("description") as string,
      descriptionEn: (formData.get("description_en") as string) || "",
      descriptionAr: (formData.get("description_ar") as string) || "",
      price: formData.get("price") as string,
      pricePerMeter: formData.get("pricePerMeter") as string,
      location: formData.get("location") as string,
      locationEn: (formData.get("location_en") as string) || "",
      locationAr: (formData.get("location_ar") as string) || "",
      area: formData.get("area") as string,
      areaId: formData.get("areaId") as string,
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
      locationIframeUrl: formData.get("locationIframeUrl") as string,
    }

    // Normalize legacy-required fields from localized inputs if left empty
    const normalizedRawFormData = {
      ...rawFormData,
      title: (rawFormData.title && rawFormData.title.trim()) || rawFormData.titleEn || rawFormData.titleAr || "",
      description: (rawFormData.description && rawFormData.description.trim()) || rawFormData.descriptionEn || rawFormData.descriptionAr || "",
      location: (rawFormData.location && rawFormData.location.trim()) || rawFormData.locationEn || rawFormData.locationAr || "",
      // area must be provided via client when selecting areaId; keep as-is
    }

    const validatedFields = PropertyFormSchema.safeParse(normalizedRawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data as any
    const pricePerMeter = data.pricePerMeter || data.price / data.size

    // Extract the URL from the iframe
    const locationIframeUrl = data.locationIframeUrl ? extractSrcFromIframe(data.locationIframeUrl) : null;

    // Calculate order_index for proper positioning
    // Featured and new properties should appear at the top
    let orderIndex = 0;
    
    if (data.isFeatured || data.isNew) {
      // Get the current lowest order_index for featured/new properties
      const { data: topProperties } = await supabase
        .from("properties")
        .select("order_index")
        .or("is_featured.eq.true,is_new.eq.true")
        .order("order_index", { ascending: true })
        .limit(1);
      
      if (topProperties && topProperties.length > 0) {
        orderIndex = Math.max(0, (topProperties[0].order_index || 0) - 1);
      }
    } else {
      // Regular properties go at the end
      const { data: lastProperty } = await supabase
        .from("properties")
        .select("order_index")
        .order("order_index", { ascending: false })
        .limit(1);
      
      if (lastProperty && lastProperty.length > 0) {
        orderIndex = (lastProperty[0].order_index || 0) + 1;
      }
    }

    // Insert property into database
    const { data: property, error } = await supabase
      .from("properties")
      .insert({
        title: data.title,
        title_en: data.title_en ?? (rawFormData.titleEn || data.title),
        title_ar: data.title_ar ?? (rawFormData.titleAr || data.title),
        description: data.description,
        description_en: data.description_en ?? (rawFormData.descriptionEn || data.description),
        description_ar: data.description_ar ?? (rawFormData.descriptionAr || data.description),
        price: data.price,
        price_per_meter: pricePerMeter,
        location: data.location,
        location_en: data.location_en ?? (rawFormData.locationEn || data.location),
        location_ar: data.location_ar ?? (rawFormData.locationAr || data.location),
        area: data.area,
        area_id: data.areaId,
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
        location_iframe_url: locationIframeUrl,
        order_index: orderIndex,
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

    // Handle image uploads with thumbnail generation
    const totalImages = parseInt(formData.get("total_images") as string) || 0
    
    if (totalImages > 0) {
      const imageUploads = []
      let mainImageThumbnailUrl: string | null = null;
      
      for (let i = 0; i < totalImages; i++) {
        const imageFile = formData.get(`image_${i}`) as File
        const altText = formData.get(`image_${i}_alt`) as string
        const orderIndex = parseInt(formData.get(`image_${i}_order`) as string) || i
        const isMain = formData.get(`image_${i}_is_main`) === "true"
        
        if (imageFile && imageFile.size > 0) {
          console.log(`Uploading image ${i + 1}/${totalImages}: ${imageFile.name} (${imageFile.size} bytes)`)
          
          // Upload image and generate thumbnail
          const uploadResult = await uploadImageToStorage(imageFile, property.id, i)
          
          if (uploadResult) {
            console.log(`Image ${i + 1} uploaded successfully`)
            
            // Insert into property_images table
            const imageInsert = supabase
              .from("property_images")
              .insert({
                property_id: property.id,
                url: uploadResult.originalUrl,
                thumbnail_url: uploadResult.thumbnailUrl, // Add this field to your DB schema
                alt_text: altText || null,
                order_index: orderIndex,
                is_main: isMain
              })
            
            imageUploads.push(imageInsert)
            
            // Store the main image thumbnail URL
            if (isMain || (i === 0 && !mainImageThumbnailUrl)) {
              mainImageThumbnailUrl = uploadResult.thumbnailUrl;
            }
          } else {
            console.error(`Failed to upload image ${i + 1}: ${imageFile.name}`)
          }
        } else {
          console.log(`Skipping image ${i + 1}: No file or empty file`)
        }
      }
      
      // Execute all image uploads
      if (imageUploads.length > 0) {
        console.log(`Executing ${imageUploads.length} image database insertions`)
        const results = await Promise.all(imageUploads);
        const errors = results.filter(result => result.error);
        
        if (errors.length > 0) {
          console.error(`${errors.length}/${results.length} image uploads failed:`, errors.map(e => e.error));
          // Continue anyway, don't fail the entire operation
        } else {
          console.log(`All ${results.length} images uploaded successfully`)
        }
      }

      // Update property with thumbnail_url (now points to optimized thumbnail)
      if (mainImageThumbnailUrl) {
        await supabase
          .from("properties")
          .update({ thumbnail_url: mainImageThumbnailUrl })
          .eq("id", property.id);
      }
    }

    // Handle videos (URLs and/or uploaded files)
    const totalVideos = parseInt(formData.get("total_videos") as string) || 0
    if (totalVideos > 0) {
      const videoOps = []
      for (let i = 0; i < totalVideos; i++) {
        const providedUrl = formData.get(`video_${i}_url`) as string
        const caption = formData.get(`video_${i}_caption`) as string
        const orderIndex = parseInt(formData.get(`video_${i}_order`) as string) || i

        if (providedUrl) {
          const insertOp = supabase.from('property_videos').insert({
            property_id: property.id,
            url: providedUrl,
            caption: caption || null,
            order_index: orderIndex,
          })
          videoOps.push(insertOp)
        }
      }
      if (videoOps.length > 0) {
        await Promise.all(videoOps)
      }
    }

    // Revalidate all pages that might show this property
    revalidatePath("/admin/properties")
    revalidatePath("/") // Home page
    revalidatePath("/en") // English home page
    revalidatePath("/ar") // Arabic home page
    revalidatePath("/en/search") // Search pages
    revalidatePath("/ar/search")
    
    // If property is featured, revalidate featured pages
    if (data.isFeatured) {
      revalidatePath("/admin/featured")
    }
    
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
// Helper function to delete image from storage
async function deleteImageFromStorage(url: string): Promise<void> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies })
    
    // Extract file path from URL
    const urlParts = url.split('/')
    const fileName = urlParts[urlParts.length - 1]
    
    // Handle both original images and thumbnails
    let filePath: string;
    if (fileName.includes('_thumb')) {
      // This is a thumbnail
      filePath = `properties/thumbnails/${fileName}`
    } else {
      // This is an original image
      filePath = `properties/${fileName}`
    }

    await supabase.storage
      .from('property-images')
      .remove([filePath])
  } catch (error) {
    console.error('Error deleting image:', error)
  }
}

// Helper function to extract URL from iframe
function extractSrcFromIframe(iframe: string): string | null {
  if (!iframe || iframe.trim() === '') return null;
  
  // Try to match src attribute
  const srcMatch = iframe.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];
  
  // Try to match src attribute with single quotes
  const srcMatchSingle = iframe.match(/src='([^']+)'/);
  if (srcMatchSingle) return srcMatchSingle[1];
  
  // If it's already a URL (not wrapped in iframe), return as is
  if (iframe.includes('maps.google.com') || iframe.includes('google.com/maps')) {
    return iframe.trim();
  }
  
  return null;
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { message: "Admin access required", success: false }
    }

    // Extract and validate form data (same as create)
    const rawFormData = {
      title: formData.get("title") as string,
      titleEn: (formData.get("title_en") as string) || "",
      titleAr: (formData.get("title_ar") as string) || "",
      description: formData.get("description") as string,
      descriptionEn: (formData.get("description_en") as string) || "",
      descriptionAr: (formData.get("description_ar") as string) || "",
      price: formData.get("price") as string,
      pricePerMeter: formData.get("pricePerMeter") as string,
      location: formData.get("location") as string,
      locationEn: (formData.get("location_en") as string) || "",
      locationAr: (formData.get("location_ar") as string) || "",
      area: formData.get("area") as string,
      areaId: formData.get("areaId") as string,
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
      locationIframeUrl: formData.get("locationIframeUrl") as string,
    }

    const validatedFields = PropertyFormSchema.safeParse(rawFormData)

    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: "Validation failed. Please check your inputs.",
        success: false,
      }
    }

    const data = validatedFields.data as any
    const pricePerMeter = data.pricePerMeter || data.price / data.size

    // Extract the URL from the iframe
    const locationIframeUrl = data.locationIframeUrl ? extractSrcFromIframe(data.locationIframeUrl) : null;

    // Get current property to check if featured/new status changed
    const { data: currentProperty } = await supabase
      .from("properties")
      .select("is_featured, is_new, order_index")
      .eq("id", id)
      .single();

    let updateData: any = {
      title: data.title,
      title_en: (data.title_en && data.title_en.trim()) || rawFormData.titleEn || data.title,
      title_ar: (data.title_ar && data.title_ar.trim()) || rawFormData.titleAr || data.title,
      description: data.description,
      description_en: (data.description_en && data.description_en.trim()) || rawFormData.descriptionEn || data.description,
      description_ar: (data.description_ar && data.description_ar.trim()) || rawFormData.descriptionAr || data.description,
      price: data.price,
      price_per_meter: pricePerMeter,
      location: data.location,
      location_en: (data.location_en && data.location_en.trim()) || rawFormData.locationEn || data.location,
      location_ar: (data.location_ar && data.location_ar.trim()) || rawFormData.locationAr || data.location,
      area: data.area,
      area_id: data.areaId,
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
      location_iframe_url: locationIframeUrl,
    };

    // If featured/new status changed, recalculate order_index
    if (currentProperty && 
        ((currentProperty.is_featured !== data.isFeatured) || 
         (currentProperty.is_new !== data.isNew))) {
      
      let newOrderIndex = currentProperty.order_index || 0;
      
      if (data.isFeatured || data.isNew) {
        // Moving to featured/new - place at top
        const { data: topProperties } = await supabase
          .from("properties")
          .select("order_index")
          .or("is_featured.eq.true,is_new.eq.true")
          .order("order_index", { ascending: true })
          .limit(1);
        
        if (topProperties && topProperties.length > 0) {
          newOrderIndex = Math.max(0, (topProperties[0].order_index || 0) - 1);
        } else {
          newOrderIndex = 0;
        }
      } else {
        // Moving from featured/new to regular - place at end
        const { data: lastProperty } = await supabase
          .from("properties")
          .select("order_index")
          .eq("is_featured", false)
          .eq("is_new", false)
          .order("order_index", { ascending: false })
          .limit(1);
        
        if (lastProperty && lastProperty.length > 0) {
          newOrderIndex = (lastProperty[0].order_index || 0) + 1;
        }
      }
      
      updateData.order_index = newOrderIndex;
    }

    // Update property in database
    const { error } = await supabase
      .from("properties")
      .update(updateData)
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
          const uploadResult = await uploadImageToStorage(imageFile, id, i)
          
          if (uploadResult) {
            const imageInsert = supabase
              .from("property_images")
              .insert({
                property_id: id,
                url: uploadResult.originalUrl,
                thumbnail_url: uploadResult.thumbnailUrl,
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
            // Delete both original and thumbnail from storage
            await deleteImageFromStorage(image.url)
            if (image.thumbnail_url && image.thumbnail_url !== image.url) {
              await deleteImageFromStorage(image.thumbnail_url)
            }
            
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
      let mainImageThumbnailUrl: string | null = null;
      if (imageOperations.length > 0) {
        const results = await Promise.all(imageOperations);
        const hasErrors = results.some(result => result.error);
        
        if (hasErrors) {
          console.error("Some image operations failed");
          // Continue anyway, don't fail the entire operation
        }

        // Find the main image thumbnail URL from the results
        // We need to check the actual data returned from the database operations
        const mainImageResult = results.find(result => {
          const data = result.data as any;
          return data && Array.isArray(data) && data.length > 0 && data[0].is_main;
        });
        
        if (mainImageResult) {
          const data = mainImageResult.data as any;
          if (data && Array.isArray(data) && data.length > 0) {
            mainImageThumbnailUrl = data[0].thumbnail_url;
          }
        } else if (results.length > 0) {
          // Fallback: if no main image explicitly set, use the first image in the updated list
          const firstResult = results[0];
          const data = firstResult.data as any;
          if (data && Array.isArray(data) && data.length > 0) {
            mainImageThumbnailUrl = data[0].thumbnail_url;
          }
        }
      }

      // Update property with thumbnail_url if a main image was found
      if (mainImageThumbnailUrl) {
        await supabase
          .from("properties")
          .update({ thumbnail_url: mainImageThumbnailUrl })
          .eq("id", id);
      }
    }

    // Handle video updates (support file uploads and URLs)
    const totalVideos = parseInt(formData.get("total_videos") as string) || 0
    const { data: currentVideos } = await supabase
      .from("property_videos")
      .select("*")
      .eq("property_id", id)

    const existingVideoIds = new Set<string>()
    const videoOperations = []

    for (let i = 0; i < totalVideos; i++) {
      const videoId = formData.get(`video_${i}_id`) as string
      const urlFromForm = formData.get(`video_${i}_url`) as string
      const caption = formData.get(`video_${i}_caption`) as string
      const orderIndex = parseInt(formData.get(`video_${i}_order`) as string) || i

      if (videoId) {
        existingVideoIds.add(videoId)
        const videoUpdate = supabase.from("property_videos").update({
          url: urlFromForm || null,
          caption: caption || null,
          order_index: orderIndex,
        }).eq("id", videoId)
        videoOperations.push(videoUpdate)
      } else if (urlFromForm) {
        const videoInsert = supabase.from("property_videos").insert({
          property_id: id,
          url: urlFromForm,
          caption: caption || null,
          order_index: orderIndex,
        })
        videoOperations.push(videoInsert)
      }
    }

    if (currentVideos) {
      for (const video of currentVideos) {
        if (!existingVideoIds.has(video.id)) {
          const videoDelete = supabase.from("property_videos").delete().eq("id", video.id)
          videoOperations.push(videoDelete)
        }
      }
    }

    if (videoOperations.length > 0) {
      await Promise.all(videoOperations)
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { success: false, message: "Admin access required" }
    }

    // First, get all images associated with this property
    const { data: propertyImages } = await supabase
      .from("property_images")
      .select("url, thumbnail_url")
      .eq("property_id", id)

    // Delete the property (this will cascade delete property_images due to foreign key)
    const { error } = await supabase.from("properties").delete().eq("id", id)

    if (error) {
      console.error("Error deleting property:", error)
      return { success: false, message: "Failed to delete property" }
    }

    // Delete images from storage
    if (propertyImages) {
      for (const image of propertyImages) {
        await deleteImageFromStorage(image.url)
        if (image.thumbnail_url && image.thumbnail_url !== image.url) {
          await deleteImageFromStorage(image.thumbnail_url)
        }
      }
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
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { success: false, message: "Admin access required" }
    }

    // Get current property to check if we need to reorder
    const { data: currentProperty } = await supabase
      .from("properties")
      .select("is_featured, is_new, order_index")
      .eq("id", id)
      .single();

    let updateData: any = { 
      is_featured: featured, 
      updated_at: new Date().toISOString() 
    };

    // If featuring status changed, recalculate order_index
    if (currentProperty && currentProperty.is_featured !== featured) {
      let newOrderIndex = currentProperty.order_index || 0;
      
      if (featured || currentProperty.is_new) {
        // Moving to featured (or staying new) - place at top
        const { data: topProperties } = await supabase
          .from("properties")
          .select("order_index")
          .or("is_featured.eq.true,is_new.eq.true")
          .order("order_index", { ascending: true })
          .limit(1);
        
        if (topProperties && topProperties.length > 0) {
          newOrderIndex = Math.max(0, (topProperties[0].order_index || 0) - 1);
        } else {
          newOrderIndex = 0;
        }
      } else if (!featured && !currentProperty.is_new) {
        // Moving to regular (not featured and not new) - place at end
        const { data: lastProperty } = await supabase
          .from("properties")
          .select("order_index")
          .eq("is_featured", false)
          .eq("is_new", false)
          .order("order_index", { ascending: false })
          .limit(1);
        
        if (lastProperty && lastProperty.length > 0) {
          newOrderIndex = (lastProperty[0].order_index || 0) + 1;
        }
      }
      
      updateData.order_index = newOrderIndex;
    }

    // If unfeaturing, ensure main featured flag is removed as well
    if (!featured) {
      updateData.is_main_featured = false
    }

    const { error } = await supabase
      .from("properties")
      .update(updateData)
      .eq("id", id)

    if (error) {
      console.error("Error toggling property featured status:", error)
      return { success: false, message: "Failed to update property" }
    }

    return { success: true, message: `Property ${featured ? "featured" : "unfeatured"} successfully` }
  } catch (error) {
    console.error("Error in togglePropertyFeatured:", error)
    return { success: false, message: "An unexpected error occurred" }
  } finally {
    revalidatePath("/admin/featured")
  }
}

export async function updatePropertyOrder(updates: { id: string; order_index: number }[]): Promise<{ success: boolean; message: string }> {
  try {
    const supabase = createServerComponentClient<Database>({ cookies });

    // Check if user is authenticated and is admin
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return { success: false, message: "Authentication required" };
    }

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle();

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") {
      return { success: false, message: "Admin access required" };
    }

    // Perform batch update using individual update operations
    const updatePromises = updates.map(update => 
      supabase
        .from("properties")
        .update({ order_index: update.order_index })
        .eq("id", update.id)
    );

    const results = await Promise.all(updatePromises);
    const errors = results.filter(result => result.error);

    if (errors.length > 0) {
      console.error("Error updating property order:", errors[0].error);
      return { success: false, message: "Failed to update property order." };
    }

    revalidatePath("/admin/properties");
    revalidatePath("/"); // Revalidate homepage as well if order affects featured/new properties
    return { success: true, message: "Property order updated successfully!" };
  } catch (error) {
    console.error("Error in updatePropertyOrder:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
} 

// Set or unset a single property as main featured. Ensures uniqueness.
export async function setMainFeatured(
  id: string,
  isMain: boolean
): Promise<{ success: boolean; message: string }> {
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

    if (isMain) {
      // Clear current main featured (if any)
      await supabase
        .from("properties")
        .update({ is_main_featured: false })
        .eq("is_main_featured", true)

      // Place as top of featured/new stack if needed
      const { data: topProperties } = await supabase
        .from("properties")
        .select("order_index")
        .or("is_featured.eq.true,is_new.eq.true")
        .order("order_index", { ascending: true })
        .limit(1)

      let newOrderIndex = 0
      if (topProperties && topProperties.length > 0) {
        newOrderIndex = Math.max(0, (topProperties[0].order_index || 0) - 1)
      }

      // Ensure the target is featured and mark as main
      const { error: setErr } = await supabase
        .from("properties")
        .update({ is_featured: true, is_main_featured: true, order_index: newOrderIndex, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (setErr) {
        console.error("Error setting main featured:", setErr)
        return { success: false, message: "Failed to set main featured" }
      }
    } else {
      const { error: unsetErr } = await supabase
        .from("properties")
        .update({ is_main_featured: false, updated_at: new Date().toISOString() })
        .eq("id", id)

      if (unsetErr) {
        console.error("Error unsetting main featured:", unsetErr)
        return { success: false, message: "Failed to unset main featured" }
      }
    }

    revalidatePath("/admin/featured")
    revalidatePath("/")
    return { success: true, message: isMain ? "Set as main featured" : "Removed from main featured" }
  } catch (error) {
    console.error("Error in setMainFeatured:", error)
    return { success: false, message: "An unexpected error occurred" }
  }
}