"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { signOutAction } from "@/lib/auth/actions"

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ""

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "user" | "admin"
}

interface AuthContextType {
  /** Same object as `profile`; kept for components written against the old Supabase user. */
  user: UserProfile | null
  profile: UserProfile | null
  loading: boolean
  isAdmin: boolean
  signOut: (lng?: string) => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(`${BASE_PATH}/api/me`, { cache: "no-store", credentials: "same-origin" })
      const json = res.ok ? await res.json() : { user: null }
      setProfile(json.user ?? null)
    } catch {
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signOut = useCallback(async (lng?: string) => {
    setProfile(null)
    await signOutAction(lng)
  }, [])

  return (
    <AuthContext.Provider
      value={{ user: profile, profile, loading, isAdmin: profile?.role === "admin", signOut, refresh }}
    >
      {children}
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
