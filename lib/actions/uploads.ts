"use server"

import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
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
    const supabase = createServerComponentClient<Database>({ cookies })

    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return { success: false, message: "Authentication required" }
    }

    const incomingFiles = formData.getAll("files") as File[]
    if (!incomingFiles || incomingFiles.length === 0) {
      return { success: false, message: "No files provided" }
    }

    // Optional override support
    const targetBucket = (formData.get("bucket") as string) || "property-images"
    const prefix = (formData.get("prefix") as string) || "uploads"

    const uploadedUrls: string[] = []

    for (const file of incomingFiles) {
      const safeName = file.name.replace(/\s+/g, "_")
      const fileExt = safeName.split(".").pop() || "jpg"
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


