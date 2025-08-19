import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"
import { match } from "@formatjs/intl-localematcher"
import Negotiator from "negotiator"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { i18n } from "./lib/i18n/config"

function getLocale(request: NextRequest): string {
  const negotiatorHeaders: Record<string, string> = {}
  request.headers.forEach((value, key) => (negotiatorHeaders[key] = value))

  // @ts-ignore locales are readonly
  const locales: string[] = i18n.locales

  let languages = new Negotiator({ headers: negotiatorHeaders }).languages(locales)

  const locale = match(languages, locales, i18n.defaultLocale)

  return locale
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ✅ Allow direct access to public folders (no redirects, no checks)
  const PUBLIC_PREFIXES = ['/videos', '/images', '/categories']
  if (PUBLIC_PREFIXES.some(p => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  // --- existing logic below ---
  const pathnameIsMissingLocale = i18n.locales.every(
    (locale) => !pathname.startsWith(`/${locale}/`) && pathname !== `/${locale}`,
  )

  if (pathnameIsMissingLocale) {
    const locale = getLocale(request)
    return NextResponse.redirect(new URL(`/${locale}${pathname.startsWith("/") ? "" : "/"}${pathname}`, request.url))
  }

  const locale = pathname.split("/")[1]
  const isAdminRoute = pathname.includes("/admin")

  if (isAdminRoute) {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) return NextResponse.redirect(new URL(`/${locale}/auth/login`, request.url))

    const { data: profile } = await supabase
      .from("user_profiles")
      .select("role")
      .eq("id", session.user.id)
      .maybeSingle()

    const role = profile?.role || (session.user.user_metadata?.role as string) || "user"
    if (role !== "admin") return NextResponse.redirect(new URL(`/${locale}`, request.url))

    return res
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp|mp4|mov|avi|wmv|flv|webm|mkv)$).*)"]}