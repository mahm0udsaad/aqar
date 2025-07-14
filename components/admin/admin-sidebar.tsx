"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Home, Building, FolderOpen, Settings, Menu, BarChart3, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { Dictionary } from "@/lib/i18n/types"

interface AdminSidebarProps {
  lng: string
  dict: Dictionary
}

export function AdminSidebar({ lng, dict }: AdminSidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const navigation = [
    { name: dict.admin.sidebar.dashboard, href: `/${lng}/admin`, icon: BarChart3 },
    { name: dict.admin.sidebar.properties, href: `/${lng}/admin/properties`, icon: Building },
    { name: dict.admin.sidebar.categories, href: `/${lng}/admin/categories`, icon: FolderOpen },
    { name: dict.admin.sidebar.featured, href: `/${lng}/admin/featured`, icon: Star },
    { name: dict.admin.sidebar.settings, href: `/${lng}/admin/settings`, icon: Settings },
  ]

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-6 border-b border-background/10">
        <Link href={`/${lng}/admin`} className="flex items-center space-x-2">
          <Building className="h-8 w-8 text-background" />
          <span className="font-bold text-xl text-background">{dict.admin.sidebar.adminPanel}</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => (
            <li key={item.name}>
              <Link
                href={item.href}
                className={cn(
                  "flex items-center space-x-3 px-3 py-2 rounded-md text-background/80 hover:text-background hover:bg-background/10 transition-colors",
                  pathname === item.href && "bg-background/20 text-background",
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.name}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      {/* Back to Website */}
      <div className="p-4 border-t border-background/10">
        <Link href={`/${lng}`}>
          <Button
            variant="outline"
            className="w-full text-background border-background/20 hover:bg-background/10 bg-transparent"
          >
            <Home className="w-4 h-4 mr-2" />
            {dict.admin.sidebar.backToWebsite}
          </Button>
        </Link>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0 admin-sidebar bg-foreground">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-background">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0 admin-sidebar bg-foreground">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  )
}
