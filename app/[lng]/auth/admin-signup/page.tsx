import { AdminSignupForm } from "@/components/auth/admin-signup-form"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface AdminSignupPageProps {
  params: Promise<{ lng: Locale }>
}

export default async function AdminSignupPage({ params }: AdminSignupPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return <AdminSignupForm lng={lng} dict={dict} />
} 