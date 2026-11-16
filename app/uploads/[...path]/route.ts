import { promises as fs, createReadStream } from "fs"
import path from "path"
import { Readable } from "stream"
import { resolveUploadPath } from "@/lib/db/storage"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".avif": "image/avif",
  ".svg": "image/svg+xml",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".m4v": "video/x-m4v",
}

export async function GET(req: Request, { params }: { params: Promise<{ path: string[] }> }) {
  const { path: segments } = await params
  const [bucket, ...rest] = (segments || []).map((s) => decodeURIComponent(s))
  if (!bucket || rest.length === 0) return new Response("Not found", { status: 404 })

  let abs: string
  try {
    abs = resolveUploadPath(bucket, rest.join("/"))
  } catch {
    return new Response("Not found", { status: 404 })
  }

  const stat = await fs.stat(abs).catch(() => null)
  if (!stat || !stat.isFile()) return new Response("Not found", { status: 404 })

  const ext = path.extname(abs).toLowerCase()
  const type = TYPES[ext]
  if (!type) return new Response("Not found", { status: 404 })

  const headers: Record<string, string> = {
    "Content-Type": type,
    "Cache-Control": "public, max-age=31536000, immutable",
    "Accept-Ranges": "bytes",
    "X-Content-Type-Options": "nosniff",
    "Last-Modified": stat.mtime.toUTCString(),
  }
  if (ext === ".svg") headers["Content-Security-Policy"] = "default-src 'none'; style-src 'unsafe-inline'; sandbox"

  // Byte ranges so videos can be streamed and seeked (Safari requires this)
  const range = req.headers.get("range")
  if (range) {
    const m = range.match(/^bytes=(\d*)-(\d*)$/)
    if (!m) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } })
    let start = m[1] ? parseInt(m[1], 10) : stat.size - parseInt(m[2] || "0", 10)
    let end = m[1] && m[2] ? parseInt(m[2], 10) : stat.size - 1
    if (!m[1] && !m[2]) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } })
    start = Math.max(0, start)
    end = Math.min(stat.size - 1, end)
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${stat.size}` } })
    const stream = Readable.toWeb(createReadStream(abs, { start, end })) as ReadableStream
    return new Response(stream, {
      status: 206,
      headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) },
    })
  }

  const stream = Readable.toWeb(createReadStream(abs)) as ReadableStream
  return new Response(stream, { headers: { ...headers, "Content-Length": String(stat.size) } })
}
