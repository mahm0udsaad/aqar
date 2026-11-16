import NextAuth from "next-auth"
import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { i18n } from "./lib/i18n/config"
import { authConfig } from "./auth.config"

const { auth } = NextAuth(authConfig)

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""
// e.g. "www.alakkareya.com": OAuth cookies are per host, so keep everyone on one host.
const CANONICAL_HOST = process.env.CANONICAL_HOST || ""

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))
  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales
  const languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)
  return match(languages, locales, i18n.defaultLocale)
}

// Auth.js re-creates the request without Next's basePath info, so strip/add it ourselves.
function appPath(pathname: string) {
  if (BASE_PATH && (pathname === BASE_PATH || pathname.startsWith(`${BASE_PATH}/`))) {
    return pathname.slice(BASE_PATH.length) || "/"
  }
  return pathname
}

function redirectTo(request: NextRequest, path: string, search = "") {
  return NextResponse.redirect(new URL(`${BASE_PATH}${path}${search}`, request.url))
}

export default auth((request) => {
  const pathname = appPath(request.nextUrl.pathname)

  if (CANONICAL_HOST) {
    const host = (request.headers.get("x-forwarded-host") || request.headers.get("host") || "").split(":")[0]
    if (host && host !== CANONICAL_HOST && !host.startsWith("localhost") && host !== "127.0.0.1") {
      const url = new URL(`https://${CANONICAL_HOST}${BASE_PATH}${pathname}${request.nextUrl.search}`)
      return NextResponse.redirect(url, 308)
    }
  }

  // Static assets and uploaded files: no locale redirect, no auth
  const PUBLIC_PREFIXES = ["/videos", "/images", "/categories", "/uploads"]
  if (PUBLIC_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  )
  if (pathnameIsMissingLocale) {
    return redirectTo(request, `/${getLocale(request)}${pathname === "/" ? "" : pathname}`, request.nextUrl.search)
  }

  const locale = pathname.split("/")[1]
  const isAdminRoute = pathname === `/${locale}/admin` || pathname.startsWith(`/${locale}/admin/`)

  if (isAdminRoute) {
    // First line of defence only: the admin layout and every admin action re-check the role in the database.
    const role = (request.auth?.user as any)?.role
    if (!request.auth?.user) {
      return redirectTo(request, `/${locale}/auth/login`, `?redirectTo=${encodeURIComponent(`${BASE_PATH}${pathname}`)}`)
    }
    if (role !== "admin") {
      return redirectTo(request, `/${locale}`)
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|avi|wmv|flv|webm|mkv)$).*)",
  ],
}
