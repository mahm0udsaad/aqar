import { UserSignupForm } from "@/components/auth/user-signup-form"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"

interface SignupPageProps {
  params: Promise<{ lng: Locale }>
}

export default async function SignupPage({ params }: SignupPageProps) {
  const { lng } = await params
  const dict = await getDictionary(lng)

  return <UserSignupForm lng={lng} dict={dict} />
}
