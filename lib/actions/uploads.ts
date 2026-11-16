"use server"

import { getAdminUser } from "@/lib/auth/session"
import { createDb } from "@/lib/db"
import type { Database } from "@/lib/supabase/types"

export interface UploadActionState {
  success?: boolean
  urls?: string[]
  message?: string
  errors?: string[]
}

/**
 * Generic server action to upload one or more images to Supabase Storage.
 * Accepts a FormData with one or multiple "files" entries.
 * Returns public URLs for the uploaded files.
 */
export async function uploadImages(
  _prevState: UploadActionState,
  formData: FormData
): Promise<UploadActionState> {
  try {
    const supabase = createDb()

    const admin = await getAdminUser()
    if (!admin) {
      return { success: false, message: "Admin access required" }
    }

    const incomingFiles = formData.getAll("files") as File[]
    if (!incomingFiles || incomingFiles.length === 0) {
      return { success: false, message: "No files provided" }
    }

    // Optional override support
    const ALLOWED_BUCKETS = new Set(["property-images", "category-images", "area-images", "site-images"])
    const requestedBucket = (formData.get("bucket") as string) || "property-images"
    const targetBucket = ALLOWED_BUCKETS.has(requestedBucket) ? requestedBucket : "property-images"
    const prefix = ((formData.get("prefix") as string) || "uploads").replace(/[^A-Za-z0-9_-]/g, "").slice(0, 40) || "uploads"
    const ALLOWED_EXT = new Set(["jpg", "jpeg", "png", "webp", "gif", "avif"])

    const uploadedUrls: string[] = []

    for (const file of incomingFiles) {
      const safeName = file.name.replace(/\s+/g, "_")
      const fileExt = (safeName.split(".").pop() || "jpg").toLowerCase()
      if (!ALLOWED_EXT.has(fileExt) || (file.type && !file.type.startsWith("image/"))) {
        return { success: false, message: `Unsupported file type: ${safeName}` }
      }
      if (file.size > 10 * 1024 * 1024) {
        return { success: false, message: `File too large (max 10MB): ${safeName}` }
      }
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
      const filePath = `${prefix}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from(targetBucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        })

      if (uploadError) {
        return { success: false, message: `Failed to upload ${safeName}: ${uploadError.message}` }
      }

      const { data: publicUrlData } = supabase.storage
        .from(targetBucket)
        .getPublicUrl(filePath)

      if (publicUrlData?.publicUrl) {
        uploadedUrls.push(publicUrlData.publicUrl)
      }
    }

    return { success: true, urls: uploadedUrls }
  } catch (error: any) {
    return { success: false, message: error?.message || "Upload failed" }
  }
}


