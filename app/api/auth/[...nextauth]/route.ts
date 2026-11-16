import { NextRequest } from "next/server"
import { handlers } from "@/auth"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

// Route handlers receive the URL without Next's basePath ("/aqar"), but Auth.js expects
// its full base path (taken from AUTH_URL), so put it back before handing over.
function withBasePath(req: NextRequest) {
  if (!BASE_PATH) return req
  const url = new URL(req.url)
  if (url.pathname === BASE_PATH || url.pathname.startsWith(`${BASE_PATH}/`)) return req
  url.pathname = `${BASE_PATH}${url.pathname}`
  return new NextRequest(url, req)
}

export const GET = (req: NextRequest) => handlers.GET(withBasePath(req))
export const POST = (req: NextRequest) => handlers.POST(withBasePath(req))
