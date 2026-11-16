import { redirect } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

interface LoginPageProps {
  params: Promise<{ lng: Locale }>
  searchParams: Promise<{ redirectTo?: string; error?: string }>
}

export default async function LoginPage({ params, searchParams }: LoginPageProps) {
  const { lng } = await params
  const { redirectTo, error } = await searchParams
  const user = await getCurrentUser()
  if (user) redirect(user.role === "admin" ? `/${lng}/admin` : `/${lng}`)

  const dict = await getDictionary(lng)
  return <LoginForm lng={lng} dict={dict} redirectTo={redirectTo} error={error} />
}
