import { redirect } from "next/navigation"
import type { Locale } from "@/lib/i18n/config"

// Accounts are created on first Google sign-in, so sign-up is the same page as login.
export default async function SignupPage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  redirect(`/${lng}/auth/login`)
}
