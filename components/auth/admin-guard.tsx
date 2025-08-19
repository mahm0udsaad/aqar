"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"

interface AdminGuardProps {
  children: React.ReactNode
  lng: string
}

export function AdminGuard({ children, lng }: AdminGuardProps) {
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const router = useRouter()
  const supabase = createClientComponentClient()

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push(`/${lng}/auth/login`)
          return
        }

        // Check if user is admin
        const { data: profile, error } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", session.user.id)
          .maybeSingle()

        if (error) {
          console.error("AdminGuard: error fetching profile", error)
        }

        // Fallback to auth metadata if profile missing
        const userRole = profile?.role || (session.user.user_metadata?.role as string) || "user"

        if (userRole !== "admin") {
          router.push(`/${lng}`)
          return
        }

        setIsAdmin(true)
      } catch (error) {
        console.error("Auth check error:", error)
        router.push(`/${lng}/auth/login`)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT" || !session) {
        router.push(`/${lng}/auth/login`)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase, router, lng])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return null
  }

  return <>{children}</>
}
