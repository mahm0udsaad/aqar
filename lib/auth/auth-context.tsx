"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState, useCallback } from "react"
import type { User } from "@supabase/supabase-js"
import { supabase } from "@/lib/supabase/client"

interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: "user" | "admin"
}

interface AuthContextType {
  user: User | null
  profile: UserProfile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signUp: (email: string, password: string, fullName?: string, phone?: string) => Promise<{ error: any }>
  signOut: () => Promise<void>
  isAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  // Memoize fetchProfile to prevent unnecessary re-renders
  const fetchProfile = useCallback(async (userId: string) => {
    try {
      console.log("Fetching profile for user:", userId)
      
      const { data, error } = await supabase
        .from("user_profiles")
        .select("*")
        .eq("id", userId)
        .single()

      if (error) {
        console.error("Error fetching profile:", {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        })
        
        // If profile doesn't exist, create a basic one from user data
        if (error.code === 'PGRST116') { // Row not found
          console.log("Profile not found, creating basic profile from user data")
          // You might want to create a profile here or handle this case differently
          setProfile(null)
        } else {
          setProfile(null)
        }
      } else {
        console.log("Profile fetched successfully:", data)
        setProfile(data)
      }
    } catch (error) {
      console.error("Unexpected error fetching profile:", error)
      setProfile(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    let isMounted = true

    // Get initial session
    const getInitialSession = async () => {
      try {
        console.log("Getting initial session...")
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error("Error getting session:", error)
          if (isMounted) {
            setLoading(false)
          }
          return
        }

        if (!isMounted) return

        console.log("Initial session:", session?.user?.id ? "User found" : "No user")
        setUser(session?.user ?? null)
        
        if (session?.user) {
          await fetchProfile(session.user.id)
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error in getInitialSession:", error)
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return

      console.log("Auth state change:", event, session?.user?.id ? "User present" : "No user")
      
      setUser(session?.user ?? null)
      
      if (session?.user) {
        // Only fetch profile if user ID is different or profile is null
        if (!profile || profile.id !== session.user.id) {
          await fetchProfile(session.user.id)
        } else {
          // User is the same, just make sure loading is false
          setLoading(false)
        }
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [fetchProfile, profile?.id]) // Add profile?.id to dependencies

  const signIn = async (email: string, password: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      return { error }
    } catch (error) {
      console.error("Error signing in:", error)
      return { error }
    }
  }

  const signUp = async (email: string, password: string, fullName?: string, phone?: string) => {
    setLoading(true)
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            phone,
            role: "user",
          },
        },
      })
      return { error }
    } catch (error) {
      console.error("Error signing up:", error)
      return { error }
    }
  }

  const signOut = async () => {
    setLoading(true)
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error("Error signing out:", error)
    }
  }

  const isAdmin = profile?.role === "admin"

  const value = {
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
    isAdmin,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}