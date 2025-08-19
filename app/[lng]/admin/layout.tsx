import type React from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { cn } from "@/lib/utils"

export default async function AdminLayout({
  children,
  params: initialParams,
}: {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}) {
  const params = await initialParams
  const dict = await getDictionary(params.lng as "en" | "ar")
  return (
    <AdminGuard lng={params.lng}>
      <div className="min-h-screen bg-gray-50/50">
        <div className="flex min-h-screen">
          <AdminSidebar lng={params.lng} dict={dict} />
          {/* Adjust margin to account for fixed sidebar on the correct side in RTL/LTR */}
          <main className={cn("flex-1 min-h-screen", params.lng === "ar" ? "md:mr-64" : "md:ml-64")}>
            <div className="container mx-auto max-w-7xl">
              {children}
            </div>
          </main>
        </div>
      </div>
    </AdminGuard>
  )
}
