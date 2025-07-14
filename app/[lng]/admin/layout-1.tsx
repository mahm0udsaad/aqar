import type React from "react"
import { AdminGuard } from "@/components/auth/admin-guard"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface AdminLayoutProps {
  children: React.ReactNode
  params: Promise<{ lng: Locale }>
}

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return <AdminGuard lng={lng}>{children}</AdminGuard>
}
