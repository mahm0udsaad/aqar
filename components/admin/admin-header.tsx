"use client"

import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Menu } from "lucide-react"
import { AdminSidebar } from "./admin-sidebar"
import { Dictionary } from "@/lib/i18n/types"

interface AdminHeaderProps {
  title: string
  description?: string
  lng: string
  dict: Dictionary
}

export function AdminHeader({ title, description, lng, dict }: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-14 items-center px-4 lg:px-6">
        {/* Mobile menu button */}
        <div className="md:hidden mr-4 rtl:ml-4 rtl:mr-0">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden">
                <Menu className="h-5 w-5" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side={lng === 'ar' ? 'right' : 'left'} className="w-64 p-0">
              <AdminSidebar lng={lng} dict={dict} />
            </SheetContent>
          </Sheet>
        </div>

        {/* Header content */}
        <div className="flex-1">
          <div className="flex flex-col space-y-1">
            <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
            {description && (
              <p className="text-sm text-muted-foreground hidden sm:block">{description}</p>
            )}
          </div>
        </div>

        {/* Right side actions could go here */}
        <div className="flex items-center space-x-2 rtl:space-x-reverse">
          {/* Add user menu, notifications, etc. here in the future */}
        </div>
      </div>
    </header>
  )
}
