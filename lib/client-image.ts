"use client"

/**
 * Shrinks a photo in the browser before upload (max 2000px, JPEG ~85%), so phone photos
 * of 5-10MB upload quickly on mobile data. Falls back to the original file if anything fails.
 */
export async function compressImage(file: File, maxSide = 2000, quality = 0.85): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file
  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" } as ImageBitmapOptions)
    const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
    if (scale === 1 && file.size < 1.5 * 1024 * 1024) {
      bitmap.close?.()
      return file
    }
    const canvas = document.createElement("canvas")
    canvas.width = Math.round(bitmap.width * scale)
    canvas.height = Math.round(bitmap.height * scale)
    const ctx = canvas.getContext("2d")
    if (!ctx) return file
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
    bitmap.close?.()
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality))
    if (!blob || blob.size >= file.size) return file
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" })
  } catch {
    return file
  }
}

/** Accepts Arabic-Indic digits and thousands separators; returns a plain digit string. */
export function toLatinDigits(value: string) {
  return value
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[,،\s]/g, "")
}
