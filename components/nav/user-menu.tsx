"use client"

import Link from "next/link"
import { Heart, LayoutDashboard, List, LogOut, MessagesSquare, ShieldCheck, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/lib/auth/auth-context"
import { tr } from "@/lib/listing-options"

export function accountLinks(lng: string): { href: string; label: string; icon: any; badge?: "messages" }[] {
  return [
    { href: `/${lng}/account/listings`, label: tr(lng, "إعلاناتي", "My listings"), icon: List },
    { href: `/${lng}/account/messages`, label: tr(lng, "الرسائل", "Messages"), icon: MessagesSquare, badge: "messages" as const },
    { href: `/${lng}/account/favorites`, label: tr(lng, "المفضلة", "Favorites"), icon: Heart },
    { href: `/${lng}/account/profile`, label: tr(lng, "حسابي", "My account"), icon: User },
  ]
}

export function UserMenu({ lng }: { lng: string }) {
  const { profile, loading, isAdmin, signOut, openSignIn } = useAuth()

  if (loading) return <div className="h-9 w-24 rounded-md bg-muted animate-pulse" />

  if (!profile) {
    return (
      <Button variant="outline" size="sm" onClick={() => openSignIn()}>
        {tr(lng, "تسجيل الدخول", "Sign in")}
      </Button>
    )
  }

  const initial = (profile.full_name || profile.email || "?").trim().charAt(0).toUpperCase()
  return (
    <DropdownMenu dir={lng === "ar" ? "rtl" : "ltr"}>
      <DropdownMenuTrigger asChild>
        <button className="relative h-9 w-9 rounded-full border bg-muted flex items-center justify-center font-semibold" aria-label={tr(lng, "قائمة الحساب", "Account menu")}>
          {profile.unread_messages > 0 && (
            <span className="absolute -top-1 -end-1 z-10 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 text-center">{profile.unread_messages}</span>
          )}
          {profile.avatar_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profile.avatar_url} alt="" className="h-full w-full object-cover rounded-full" referrerPolicy="no-referrer" />
          ) : (
            initial
          )}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="font-semibold truncate">{profile.full_name || profile.email}</div>
          <div className="text-xs text-muted-foreground">
            {profile.account_type === "broker" ? tr(lng, "وسيط", "Broker") : profile.account_type === "owner" ? tr(lng, "مالك", "Owner") : tr(lng, "أكمل بيانات حسابك", "Finish setting up")}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {accountLinks(lng).map((l) => (
          <DropdownMenuItem key={l.href} asChild>
            <Link href={l.href} className="cursor-pointer">
              <l.icon className="h-4 w-4 me-2" />
              {l.label}
              {l.badge === "messages" && profile.unread_messages > 0 && (
                <span className="ms-auto rounded-full bg-red-600 text-white text-[11px] px-1.5">{profile.unread_messages}</span>
              )}
            </Link>
          </DropdownMenuItem>
        ))}
        {isAdmin && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/${lng}/admin`} className="cursor-pointer">
                <LayoutDashboard className="h-4 w-4 me-2" />
                {tr(lng, "لوحة الإدارة", "Admin")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/${lng}/admin/moderation`} className="cursor-pointer">
                <ShieldCheck className="h-4 w-4 me-2" />
                {tr(lng, "مراجعة الإعلانات", "Review listings")}
              </Link>
            </DropdownMenuItem>
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut(lng)} className="cursor-pointer text-destructive focus:text-destructive">
          <LogOut className="h-4 w-4 me-2" />
          {tr(lng, "تسجيل الخروج", "Sign out")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
