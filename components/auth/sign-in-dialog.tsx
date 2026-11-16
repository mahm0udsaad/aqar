"use client"

import { useEffect, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { signInWithDevLogin, signInWithGoogle } from "@/lib/auth/actions"
import { tr } from "@/lib/listing-options"

export function GoogleIcon() {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" className="h-5 w-5">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z" />
      <path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z" />
    </svg>
  )
}

export function SignInDialog({
  lng,
  open,
  onOpenChange,
  redirectTo,
  devLogin = false,
}: {
  lng: string
  open: boolean
  onOpenChange: (open: boolean) => void
  redirectTo?: string
  devLogin?: boolean
}) {
  const [target, setTarget] = useState(redirectTo || "")
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (open) setTarget(redirectTo || `${window.location.pathname}${window.location.search}`)
    if (!open) setSubmitting(false)
  }, [open, redirectTo])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm" dir={lng === "ar" ? "rtl" : "ltr"}>
        <DialogHeader className="text-center sm:text-center">
          <DialogTitle className="text-xl">{tr(lng, "أهلاً بك في عقار", "Welcome to Aqar")}</DialogTitle>
          <DialogDescription>
            {tr(lng, "سجّل الدخول لتنشر عقارك مجاناً وتحفظ عقاراتك المفضلة.", "Sign in to list your property for free and save your favorites.")}
          </DialogDescription>
        </DialogHeader>

        <form action={signInWithGoogle} onSubmit={() => setSubmitting(true)}>
          <input type="hidden" name="lng" value={lng} />
          <input type="hidden" name="redirectTo" value={target} />
          <Button type="submit" variant="outline" className="w-full h-12 gap-3 text-base" disabled={submitting}>
            <GoogleIcon />
            {submitting ? tr(lng, "جارٍ التحويل إلى جوجل…", "Redirecting to Google…") : tr(lng, "المتابعة باستخدام جوجل", "Continue with Google")}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center">
          {tr(lng, "بالمتابعة أنت توافق على ", "By continuing you agree to the ")}
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/legal/terms`} className="underline" target="_blank">
            {tr(lng, "الشروط والأحكام", "Terms")}
          </a>
          {tr(lng, " و", " and ")}
          <a href={`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/legal/policies`} className="underline" target="_blank">
            {tr(lng, "سياسة الخصوصية", "Privacy Policy")}
          </a>
        </p>

        {devLogin && (
          <form action={signInWithDevLogin} className="space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">Local development login (disabled in production)</p>
            <input type="hidden" name="lng" value={lng} />
            <input type="hidden" name="redirectTo" value={target} />
            <Input name="email" type="email" placeholder="email@example.com" required />
            <Button type="submit" variant="secondary" className="w-full">
              Dev sign in
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
