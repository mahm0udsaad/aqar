import type React from "react"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { AdminSidebar } from "@/components/admin/admin-sidebar"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import { cn } from "@/lib/utils"

export const dynamic = "force-dynamic"

export default async function AdminLayout({
  children,
  params: initialParams,
}: {
  children: React.ReactNode
  params: Promise<{ lng: string }>
}) {
  const params = await initialParams
  // Server-side guard: every admin page (and the data it loads) requires an admin session.
  const user = await getCurrentUser()
  if (!user) redirect(`/${params.lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${params.lng}/admin`)}`)
  if (user.role !== "admin") redirect(`/${params.lng}`)
  const dict = await getDictionary(params.lng as "en" | "ar")
  return (
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
  )
}
