import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import type { Provider } from "next-auth/providers"
import { authConfig } from "./auth.config"
import { upsertProfileForSignIn } from "@/lib/auth/profiles"

// Local-only login so admin flows can be tested without Google credentials.
// Never active in production builds (NODE_ENV is "production" there).
const devLoginEnabled = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "1"

const providers: Provider[] = [...authConfig.providers]
if (devLoginEnabled) {
  providers.push(
    Credentials({
      id: "dev-login",
      name: "Dev login",
      credentials: { email: { label: "Email", type: "email" } },
      authorize: async (creds) => {
        const email = String(creds?.email || "").trim().toLowerCase()
        if (!email) return null
        return { id: email, email, name: email.split("@")[0] }
      },
    }),
  )
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,
    async signIn({ account, profile, user }) {
      if (account?.provider === "google") {
        // Only accept Google accounts with a verified email address
        return Boolean(profile?.email && (profile as any).email_verified !== false)
      }
      if (account?.provider === "dev-login") return devLoginEnabled && Boolean(user?.email)
      return false
    },
    async jwt({ token, user }) {
      // `user` is only present right after sign-in: link it to a user_profiles row.
      if (user?.email) {
        const profile = await upsertProfileForSignIn({
          email: user.email,
          name: user.name ?? null,
          image: user.image ?? null,
        })
        token.uid = profile.id
        token.role = profile.role
      }
      return token
    },
  },
})
