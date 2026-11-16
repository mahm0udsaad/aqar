import "server-only"
import { promises as fs } from "fs"
import path from "path"

/**
 * Disk-backed replacement for Supabase Storage.
 * Files live in UPLOADS_DIR/<bucket>/<path> and are served by app/uploads/[...path]/route.ts
 * at `${NEXT_PUBLIC_BASE_PATH}/uploads/<bucket>/<path>`.
 */

export function uploadsRoot() {
  return path.resolve(process.env.UPLOADS_DIR || path.join(process.cwd(), ".uploads"))
}

export function publicUploadsPrefix() {
  return process.env.NEXT_PUBLIC_STORAGE_PUBLIC_PREFIX || `${process.env.NEXT_PUBLIC_BASE_PATH || ""}/uploads`
}

const SAFE_SEGMENT = /^[A-Za-z0-9._-]+$/

/** Resolve bucket + relative path to an absolute path inside the uploads root, or throw. */
export function resolveUploadPath(bucket: string, relPath: string) {
  const segments = [bucket, ...relPath.split("/")].filter(Boolean)
  if (!segments.every((s) => SAFE_SEGMENT.test(s) && s !== "." && s !== "..")) {
    throw new Error("storage: invalid path")
  }
  const root = uploadsRoot()
  const abs = path.resolve(root, ...segments)
  if (!abs.startsWith(root + path.sep)) throw new Error("storage: path escapes uploads root")
  return abs
}

/** Turn a public URL (new or legacy Supabase form) back into a bucket-relative path. */
export function pathFromPublicUrl(bucket: string, url: string): string | null {
  if (!url) return null
  const markers = [`${publicUploadsPrefix()}/${bucket}/`, `/uploads/${bucket}/`, `/storage/v1/object/public/${bucket}/`]
  for (const m of markers) {
    const i = url.indexOf(m)
    if (i >= 0) return decodeURIComponent(url.slice(i + m.length).split("?")[0])
  }
  return null
}

async function toBuffer(body: unknown): Promise<Buffer> {
  if (Buffer.isBuffer(body)) return body
  if (body instanceof ArrayBuffer) return Buffer.from(body)
  if (ArrayBuffer.isView(body)) return Buffer.from(body.buffer, body.byteOffset, body.byteLength)
  if (body && typeof (body as Blob).arrayBuffer === "function") return Buffer.from(await (body as Blob).arrayBuffer())
  if (typeof body === "string") return Buffer.from(body)
  throw new Error("storage: unsupported upload body")
}

function bucketApi(bucket: string) {
  return {
    async upload(relPath: string, body: unknown, opts?: { upsert?: boolean; contentType?: string; cacheControl?: string }) {
      try {
        const abs = resolveUploadPath(bucket, relPath)
        await fs.mkdir(path.dirname(abs), { recursive: true })
        if (!opts?.upsert) {
          const exists = await fs.stat(abs).then(() => true, () => false)
          if (exists) return { data: null, error: { message: "The resource already exists", statusCode: "409" } }
        }
        await fs.writeFile(abs, await toBuffer(body))
        return { data: { path: relPath, fullPath: `${bucket}/${relPath}` }, error: null }
      } catch (e: any) {
        return { data: null, error: { message: e?.message ?? "Upload failed" } }
      }
    },

    getPublicUrl(relPath: string) {
      const clean = relPath.split("/").map(encodeURIComponent).join("/")
      return { data: { publicUrl: `${publicUploadsPrefix()}/${bucket}/${clean}` } }
    },

    async remove(paths: string[]) {
      const removed: string[] = []
      for (const p of paths) {
        try {
          await fs.unlink(resolveUploadPath(bucket, p))
          removed.push(p)
        } catch {
          // missing files are not an error, same as Supabase
        }
      }
      return { data: removed.map((name) => ({ name })), error: null }
    },

    async download(relPath: string) {
      try {
        const buf = await fs.readFile(resolveUploadPath(bucket, relPath))
        return { data: new Blob([buf]), error: null }
      } catch (e: any) {
        return { data: null, error: { message: e?.message ?? "Download failed" } }
      }
    },
  }
}

export const storage = { from: bucketApi }
