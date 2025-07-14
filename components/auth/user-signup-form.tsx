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
import { User } from "lucide-react"

interface UserSignupFormProps {
  lng: string
  dict: any
}

export function UserSignupForm({ lng, dict }: UserSignupFormProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const router = useRouter()
  const supabase = createClientComponentClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    // Validate passwords match
    if (password !== confirmPassword) {
      setError("Passwords do not match")
      setLoading(false)
      return
    }

    // Validate password length
    if (password.length < 6) {
      setError("Password must be at least 6 characters long")
      setLoading(false)
      return
    }

    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
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

      if (authError) throw authError

      if (authData.user) {
        setSuccess("Account created successfully! Please check your email to verify your account.")
        
        // Redirect after a delay
        setTimeout(() => {
          router.push(`/${lng}/auth/login`)
        }, 2000)
      }
    } catch (error: any) {
      setError(error.message || "An error occurred during signup")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-6 h-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl">{dict.auth.signup}</CardTitle>
          <CardDescription>Create your account to get started</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{dict.auth.fullName}</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">{dict.auth.email}</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{dict.auth.phone}</Label>
              <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
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

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{dict.auth.confirmPassword}</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert>
                <AlertDescription>{success}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating Account..." : dict.auth.signupButton}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              {dict.auth.hasAccount}{" "}
              <a href={`/${lng}/auth/login`} className="text-primary hover:underline">
                {dict.auth.login}
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