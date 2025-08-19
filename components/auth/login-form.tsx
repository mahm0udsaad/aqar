"use client"

import type React from "react"

import { useState } from "react"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { useRouter } from "next/navigation"
import { Building } from "lucide-react"

interface LoginFormProps {
  lng: string
  dict: any
}

export function LoginForm({ lng, dict }: LoginFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) throw error

      if (data.user) {
        // Check if user is admin
        const { data: profile } = await supabase
          .from("user_profiles")
          .select("role")
          .eq("id", data.user.id)
          .maybeSingle()

        const role = profile?.role || (data.user.user_metadata?.role as string) || "user"

        if (role === "admin") {
          router.push(`/${lng}/admin`)
        } else {
          router.push(`/${lng}`)
        }
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Building className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{dict.auth.login}</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">{dict.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{dict.auth.password}</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : dict.auth.loginButton}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {dict.auth.noAccount}{" "}
              <a href={`/${lng}/auth/signup`} className="text-primary hover:underline">
                {dict.auth.signup}
              </a>
            </p>
            <p className="text-sm text-muted-foreground">
              <a href={`/${lng}/auth/admin-signup`} className="text-primary hover:underline">
                {dict.auth.adminSignup}
              </a>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
