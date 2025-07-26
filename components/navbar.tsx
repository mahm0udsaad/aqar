"use client"

import type React from "react"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
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

interface NavbarProps {
  lng: string
  dict: any
}

export function Navbar({ lng, dict }: NavbarProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [user, setUser] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClientComponentClient()
  const isSearchPage = pathname.includes("/search")
  const { count: comparisonCount } = useComparison()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener("scroll", handleScroll)
    return () => window.removeEventListener("scroll", handleScroll)
  }, [])

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setUser(session?.user || null)

      if (session?.user) {
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()
        setUserProfile(profile)
      }
    }

    getUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUser(session?.user || null)
      if (session?.user) {
        const { data: profile } = await supabase.from("user_profiles").select("*").eq("id", session.user.id).single()
        setUserProfile(profile)
      } else {
        setUserProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${lng}/search?q=${encodeURIComponent(searchQuery.trim())}`)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push(`/${lng}`)
  }

  const toggleLanguage = () => {
    const newLng = lng === "en" ? "ar" : "en"
    const newPath = pathname.replace(`/${lng}`, `/${newLng}`)
    router.push(newPath)
  }

  return (
    <nav
      className={`sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b transition-all duration-200 h-16`}
    >
      <div className="container mx-auto px-4">
        <div className={`flex items-center justify-between h-16`}>
          {/* Logo */}
          <Link href={`/${lng}`} className="flex items-center space-x-2">
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
              href={`/${lng}/contact`}
              className={`text-sm font-medium transition-colors hover:text-primary`}
            >
              {dict.nav.contact}
            </Link>

            {/* Comparison Button */}
            <Link href={`/${lng}/compare`} className="relative">
              <Button variant="ghost" size="sm" className="flex items-center gap-2">
                <GitCompare className="h-4 w-4" />
                <span className="hidden lg:inline">Compare</span>
                {comparisonCount > 0 && (
                  <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {comparisonCount}
                  </Badge>
                )}
              </Button>
            </Link>

            {/* Language Toggle */}
            <Button variant="ghost" size="sm" onClick={toggleLanguage}>
              <Globe className="h-4 w-4 mr-2" />
              {lng.toUpperCase()}
            </Button>

            {/* User Menu */}
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <User className="h-4 w-4 mr-2" />
                    {userProfile?.full_name || user.email}
                    {userProfile?.role === "admin" && (
                      <Badge variant="secondary" className="ml-2 text-xs">
                        {dict.admin.admin}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link href={`/${lng}/loved`}>
                      <Heart className="h-4 w-4 mr-2" />
                      {dict.nav.savedProperties}
                    </Link>
                  </DropdownMenuItem>
                  {userProfile?.role === "admin" && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`/${lng}/admin`}>
                          <Settings className="h-4 w-4 mr-2" />
                          {dict.nav.admin}
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="h-4 w-4 mr-2" />
                    {dict.nav.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/${lng}/auth/login`}>{dict.nav.login}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href={`/${lng}/auth/signup`}>{dict.nav.signup}</Link>
                </Button>
              </div>
            )}
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
                    <Link href={`/${lng}/contact`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent">
                      {dict.nav.contact}
                    </Link>
                    <Link href={`/${lng}/compare`} className="text-lg font-medium py-2 px-3 rounded-md hover:bg-accent flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        <GitCompare className="h-5 w-5" />
                        Compare
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
                    {lng.toUpperCase()}
                  </Button>

                  {/* User Section */}
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
                      <Link
                        href={`/${lng}/loved`}
                        className="flex items-center text-lg py-2 px-3 rounded-md hover:bg-accent"
                      >
                        <Heart className="h-5 w-5 mr-2" />
                        {dict.nav.savedProperties}
                      </Link>
                      {userProfile?.role === "admin" && (
                        <Link
                          href={`/${lng}/admin`}
                          className="flex items-center text-lg py-2 px-3 rounded-md hover:bg-accent"
                        >
                          <Settings className="h-5 w-5 mr-2" />
                          {dict.nav.admin}
                        </Link>
                      )}
                      <Button variant="ghost" onClick={handleLogout} className="w-full justify-start text-lg">
                        <LogOut className="h-5 w-5 mr-2" />
                        {dict.nav.logout}
                      </Button>
                    </div>
                  ) : (
                    <div className="border-t pt-4 space-y-2">
                      <Button variant="outline" asChild className="w-full bg-transparent text-lg">
                        <Link href={`/${lng}/auth/login`}>{dict.nav.login}</Link>
                      </Button>
                      <Button asChild className="w-full text-lg">
                        <Link href={`/${lng}/auth/signup`}>{dict.nav.signup}</Link>
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
  )
}
