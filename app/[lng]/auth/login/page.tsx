import { LoginForm } from "@/components/auth/login-form"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface LoginPageProps {
  params: Promise<{ lng: Locale }>
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return <LoginForm lng={lng} dict={dict} />
}
