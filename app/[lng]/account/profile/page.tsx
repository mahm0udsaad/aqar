import { redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ProfileEditor } from "@/components/account/profile-editor"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

export default async function ProfilePage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/profile`)}`)
  const dict = await getDictionary(lng)
  const ar = lng === "ar"

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-xl mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>{ar ? "حسابي" : "My account"}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {ar ? "مسجّل بحساب جوجل: " : "Signed in with Google: "}
              <span dir="ltr">{user.email}</span>
            </p>
          </CardHeader>
          <CardContent>
            <ProfileEditor
              lng={lng}
              profile={{
                full_name: user.full_name,
                phone: user.phone,
                whatsapp: user.whatsapp,
                account_type: user.account_type,
                office_name: user.office_name,
              }}
            />
            <p className="text-xs text-muted-foreground mt-4">
              {ar ? "تغيير الاسم أو الرقم يحدّث بيانات التواصل على كل إعلاناتك." : "Changing your name or number updates the contact details on all your listings."}
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
