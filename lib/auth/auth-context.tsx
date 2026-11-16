"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { signOutAction } from "@/lib/auth/actions"
import { SignInDialog } from "@/components/auth/sign-in-dialog"
import { OnboardingDialog } from "@/components/auth/onboarding-dialog"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  whatsapp: string | null
  role: "user" | "admin"
  account_type: "owner" | "broker" | null
  office_name: string | null
  is_suspended: boolean
  needs_onboarding: boolean
}

interface AuthContextType {
  /** Same object as `profile`; kept for components written against the old Supabase user. */
  user: UserProfile | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signOut: (lng?: string) => Promise<void>
  refresh: () => Promise<UserProfile | null>
  /** Opens the Google sign-in popup; after signing in the user comes back to `redirectTo` (default: this page). */
  openSignIn: (redirectTo?: string) => void
  /** Opens the first-time setup (owner/broker, phone). */
  openOnboarding: () => void
  /**
   * Runs `action` when the user is signed in and set up; otherwise opens sign-in or setup first.
   * Returns true if the action ran.
   */
  requireAccount: (action?: () => void, redirectTo?: string) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({
  children,
  lng = "ar",
  devLogin = false,
}: {
  children: React.ReactNode
  lng?: string
  devLogin?: boolean
}) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [signInOpen, setSignInOpen] = useState(false)
  const [signInRedirect, setSignInRedirect] = useState<string | undefined>()
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/me`, { cache: "no-store", credentials: "same-origin" })
      const json = res.ok ? await res.json() : { user: null }
      setProfile(json.user ?? null)
      return (json.user ?? null) as UserProfile | null
    } catch {
      setProfile(null)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  // New accounts: ask for owner/broker and phone once per browser session (not on admin pages)
  useEffect(() => {
    if (!profile?.needs_onboarding) return
    if (typeof window !== "undefined" && window.location.pathname.includes("/admin")) return
    try {
      if (sessionStorage.getItem("onboarding-dismissed")) return
    } catch {}
    setOnboardingOpen(true)
  }, [profile?.needs_onboarding])

  const signOut = useCallback(async (lang?: string) => {
    setProfile(null)
    await signOutAction(lang || lng)
  }, [lng])

  const openSignIn = useCallback((redirectTo?: string) => {
    setSignInRedirect(redirectTo)
    setSignInOpen(true)
  }, [])

  const openOnboarding = useCallback(() => setOnboardingOpen(true), [])

  const requireAccount = useCallback(
    (action?: () => void, redirectTo?: string) => {
      if (!profile) {
        openSignIn(redirectTo)
        return false
      }
      if (profile.needs_onboarding) {
        setPendingAction(() => action || null)
        setOnboardingOpen(true)
        return false
      }
      action?.()
      return true
    },
    [profile, openSignIn],
  )

  return (
    <AuthContext.Provider
      value={{
        user: profile,
        profile,
        loading,
        isAdmin: profile?.role === "admin",
        signOut,
        refresh,
        openSignIn,
        openOnboarding,
        requireAccount,
      }}
    >
      {children}
      <SignInDialog lng={lng} open={signInOpen} onOpenChange={setSignInOpen} redirectTo={signInRedirect} devLogin={devLogin} />
      {profile && (
        <OnboardingDialog
          lng={lng}
          open={onboardingOpen}
          profile={profile}
          onOpenChange={(open) => {
            setOnboardingOpen(open)
            if (!open) {
              try {
                sessionStorage.setItem("onboarding-dismissed", "1")
              } catch {}
            }
          }}
          onSaved={async () => {
            const updated = await refresh()
            setOnboardingOpen(false)
            if (updated && !updated.needs_onboarding && pendingAction) {
              const run = pendingAction
              setPendingAction(null)
              run()
            }
          }}
        />
      )}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
