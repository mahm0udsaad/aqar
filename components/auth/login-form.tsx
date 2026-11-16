import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Building } from "lucide-react"
import { signInWithDevLogin, signInWithGoogle } from "@/lib/auth/actions"

interface LoginFormProps {
  lng: string
  dict: any
  redirectTo?: string
  error?: string
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.24 1.4-1.7 4.1-5.5 4.1-3.3 0-6-2.7-6-6.1s2.7-6.1 6-6.1c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.6 2.5 12 2.5 6.8 2.5 2.6 6.7 2.6 12s4.2 9.5 9.4 9.5c5.4 0 9-3.8 9-9.2 0-.6-.1-1.1-.2-1.6H12z" />
    </svg>
  )
}

export function LoginForm({ lng, dict, redirectTo, error }: LoginFormProps) {
  const isAr = lng === "ar"
  const showDevLogin = process.env.NODE_ENV !== "production" && process.env.AUTH_DEV_LOGIN === "1"

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Building className="w-12 h-12 text-primary" />
          </div>
          <CardTitle className="text-2xl">{dict.auth.login}</CardTitle>
          <CardDescription>
            {isAr ? "سجّل الدخول بحساب جوجل للمتابعة" : "Sign in with your Google account to continue"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>
                {isAr ? "تعذّر تسجيل الدخول. حاول مرة أخرى." : "Sign-in failed. Please try again."}
              </AlertDescription>
            </Alert>
          )}

          <form action={signInWithGoogle}>
            <input type="hidden" name="lng" value={lng} />
            {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
            <Button type="submit" variant="outline" className="w-full gap-3 h-11">
              <GoogleIcon />
              {isAr ? "المتابعة باستخدام جوجل" : "Continue with Google"}
            </Button>
          </form>

          {showDevLogin && (
            <form action={signInWithDevLogin} className="space-y-2 border-t pt-4">
              <p className="text-xs text-muted-foreground">Local development login (disabled in production)</p>
              <input type="hidden" name="lng" value={lng} />
              {redirectTo && <input type="hidden" name="redirectTo" value={redirectTo} />}
              <Input name="email" type="email" placeholder="email@example.com" required />
              <Button type="submit" variant="secondary" className="w-full">
                Dev sign in
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
