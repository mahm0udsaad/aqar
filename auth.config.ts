import type { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

/**
 * Edge-safe Auth.js config (no database access). Used by middleware to read the
 * session JWT. The full config with DB callbacks lives in auth.ts.
 *
 * Env: AUTH_SECRET, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET, and
 * AUTH_URL=https://<host><basePath>/api/auth (the path tells Auth.js its base path).
 */
export const authConfig = {
  providers: [Google],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  trustHost: true,
  callbacks: {
    session({ session, token }) {
      if (session.user) {
        ;(session.user as any).id = token.uid as string | undefined
        ;(session.user as any).role = (token.role as string | undefined) ?? "user"
      }
      return session
    },
  },
} satisfies NextAuthConfig
