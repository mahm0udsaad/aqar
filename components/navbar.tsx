"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useAuth } from "@/lib/auth/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Menu, Search, User, Settings, LogOut, Heart, Globe, GitCompare } from "lucide-react"
import { SearchFiltersSheet } from "./search-filters-sheet"
import { useComparison } from "@/contexts/comparison-context"
import { PostListingButton } from "@/components/nav/post-listing-button"
import { UserMenu, accountLinks } from "@/components/nav/user-menu"

interface NavbarProps {
  lng: string
  dict: any
}

export function Navbar({ lng, dict }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { user, profile: userProfile, isAdmin, signOut, openSignIn } = useAuth()
  const pathname = usePathname()
  const router = useRouter()
  const isSearchPage = pathname.includes("/search")
  const hideFloatingPost = pathname.includes("/listings/new") || pathname.includes("/edit") || pathname.includes("/admin")
  const { count: comparisonCount } = useComparison()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${lng}/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await signOut(lng)
  }

  const toggleLanguage = () => {
    const newLng = lng === "en" ? "ar" : "en"
    const newPath = pathname.replace(`/${lng}`, `/${newLng}`)
    router.push(newPath)
  }

  return (
    <>
    <nav
      className={`sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-200 h-16`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16`}>
          {/* Logo */}
          <Link href={`/${lng}`} className="flex items-center gap-2">
            <span className="font-bold text-xl">{dict.nav.aqar}</span>
          </Link>

          {/* Search Bar - Hidden on Search Page */}
          {!isSearchPage && (
            <div className={`hidden md:flex flex-1 max-w-md mx-8`}>
              <form onSubmit={handleSearch} className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  type="text"
                  placeholder={dict.home.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 pr-4 w-full"
                />
              </form>
            </div>
          )}

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <Link
              href={`/${lng}/search`}
              className={`text-sm font-medium transition-colors hover:text-primary`}
            >
              {dict.nav.search}
            </Link>
            <Link
              href={`/${lng}/categories`}
              className={`text-sm font-medium transition-colors hover:text-primary`}
            >
              {dict.nav.categories}
            </Link>
            <Link
              href={`/${lng}/areas`}
              className={`text-sm font-medium transition-colors hover:text-primary`}
            >
              {lng === "ar" ? "المناطق" : "Areas"}
            </Link>
            <Link
              href={`/${lng}/contact`}
              className={`text-sm font-medium transition-colors hover:text-primary`}
            >
              {dict.nav.contact}
            </Link>

            {/* Comparison Button */}
            <Link href={`/${lng}/compare`} className="relative">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                <span className="hidden lg:inline">
                  {lng === "ar" ? "المقارنة" : "Compare"}
                </span>
                {comparisonCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {comparisonCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Language Toggle - show target language code for clarity */}
            <Button variant="ghost" size="sm" onClick={toggleLanguage}>
              <Globe className="h-4 w-4 mr-2" />
              {lng === "ar" ? "EN" : "AR"}
            </Button>

            <PostListingButton lng={lng} />
            <UserMenu lng={lng} />
          </div>

          {/* Mobile Menu */}
          <div className="md:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full">
                <div className="flex flex-col space-y-4 mt-8">
                  {/* Mobile Search */}
                  {!isSearchPage && (
                    <form onSubmit={handleSearch} className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        type="text"
                        placeholder={dict.home.searchPlaceholder}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </form>
                  )}

                  {/* Mobile Navigation Links */}
                  <div className="flex flex-col space-y-2">
                    <Link href={`/${lng}`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent">
                      {dict.nav.home}
                    </Link>
                    <Link href={`/${lng}/search`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent">
                      {dict.nav.search}
                    </Link>
                    <Link
                      href={`/${lng}/categories`}
                      className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent"
                    >
                      {dict.nav.categories}
                    </Link>
                    <Link href={`/${lng}/areas`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent">
                      {lng === "ar" ? "المناطق" : "Areas"}
                    </Link>
                    <Link href={`/${lng}/contact`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent">
                      {dict.nav.contact}
                    </Link>
                    <Link href={`/${lng}/compare`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5" />
                        {lng === "ar" ? "المقارنة" : "Compare"}
                      </span>
                      {comparisonCount > 0 && (
                        <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                          {comparisonCount}
                        </Badge>
                      )}
                    </Link>
                  </div>

                  {/* Language Toggle */}
                  <Button variant="outline" onClick={toggleLanguage} className="justify-start bg-transparent text-lg">
                    <Globe className="h-5 w-5 mr-2" />
                    {lng === "ar" ? "EN" : "AR"}
                  </Button>

                  {/* User Section */}
                  <PostListingButton lng={lng} className="w-full h-11 text-base" />
                  {user ? (
                    <div className="border-t pt-4 space-y-2">
                      <div className="px-3 py-2">
                        <p className="text-lg font-medium">{userProfile?.full_name || user.email}</p>
                        {userProfile?.role === "admin" && (
                          <Badge variant="secondary" className="mt-1">
                            {dict.admin.admin}
                          </Badge>
                        )}
                      </div>
                      {accountLinks(lng).map((l) => (
                        <Link key={l.href} href={l.href} className="flex items-center text-lg py-2 px-3 rounded-md hover:bg-accent">
                          <l.icon className="h-5 w-5 me-2" />
                          {l.label}
                        </Link>
                      ))}
                      {userProfile?.role === "admin" && (
                        <Link
                          href={`/${lng}/admin`}
                          className="flex items-center text-lg py-2 px-3 rounded-md hover:bg-accent"
                        >
                          <Settings className="h-5 w-5 me-2" />
                          {dict.nav.admin}
                        </Link>
                      )}
                      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg">
                        <LogOut className="h-5 w-5 me-2" />
                        {dict.nav.logout}
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button variant="outline" className="w-full bg-transparent text-lg" onClick={() => openSignIn()}>
                        {dict.nav.login}
                      </Button>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
    {/* outside <nav>: its backdrop blur would trap position:fixed children */}
    {!hideFloatingPost && <PostListingButton lng={lng} floating />}
    </>
  )
}
