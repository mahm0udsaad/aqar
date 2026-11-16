"use server"

import { signIn, signOut } from "@/auth"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

/** Only allow redirects to paths inside this app. */
function safeRedirect(target: string | undefined, fallback: string) {
  if (!target || !target.startsWith("/") || target.startsWith("//")) return `${BASE_PATH}${fallback}`
  return target.startsWith(`${BASE_PATH}/`) || BASE_PATH === "" ? target : `${BASE_PATH}${target}`
}

export async function signInWithGoogle(formData: FormData) {
  const lng = formData.get("lng") === "en" ? "en" : "ar"
  const redirectTo = safeRedirect(String(formData.get("redirectTo") || ""), `/${lng}`)
  await signIn("google", { redirectTo })
}

export async function signInWithDevLogin(formData: FormData) {
  if (process.env.NODE_ENV === "production" || process.env.AUTH_DEV_LOGIN !== "1") return
  const lng = formData.get("lng") === "en" ? "en" : "ar"
  await signIn("dev-login", {
    email: String(formData.get("email") || ""),
    redirectTo: safeRedirect(String(formData.get("redirectTo") || ""), `/${lng}`),
  })
}

export async function signOutAction(lng: string = "ar") {
  await signOut({ redirectTo: `${BASE_PATH}/${lng === "en" ? "en" : "ar"}` })
}
