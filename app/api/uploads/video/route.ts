import { NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { getAdminUser } from "@/lib/auth/session"
import { storage } from "@/lib/db/storage"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const MAX_BYTES = 200 * 1024 * 1024
const EXT: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogg",
  "video/quicktime": "mov",
}

export async function POST(req: Request) {
  if (!(await getAdminUser())) return NextResponse.json({ error: "Admin access required" }, { status: 401 })

  const length = Number(req.headers.get("content-length") || 0)
  if (length > MAX_BYTES + 1024 * 1024) return NextResponse.json({ error: "Video too large (max 200MB)" }, { status: 413 })

  let file: File | null = null
  try {
    const form = await req.formData()
    const f = form.get("file")
    file = f instanceof File ? f : null
  } catch {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 })
  }
  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 })
  const ext = EXT[file.type]
  if (!ext) return NextResponse.json({ error: "Unsupported video type" }, { status: 415 })
  if (file.size > MAX_BYTES) return NextResponse.json({ error: "Video too large (max 200MB)" }, { status: 413 })

  const path = `videos/properties/${randomUUID()}.${ext}`
  const bucket = storage.from("property-videos")
  const { error } = await bucket.upload(path, file, { contentType: file.type })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ url: bucket.getPublicUrl(path).data.publicUrl })
}
