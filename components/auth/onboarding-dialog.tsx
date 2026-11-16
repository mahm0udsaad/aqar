"use client"

import { useEffect, useState, useTransition } from "react"
import { Building2, Home } from "lucide-react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveProfile } from "@/lib/actions/account"
import { tr } from "@/lib/listing-options"
import { cn } from "@/lib/utils"

interface ProfileLike {
  full_name: string | null
  phone: string | null
  whatsapp: string | null
  account_type: "owner" | "broker" | null
  office_name: string | null
}

/** The account form: owner/broker, name, phone. Used in the first-time dialog and on the profile page. */
export function AccountForm({
  lng,
  profile,
  onSaved,
  submitLabel,
}: {
  lng: string
  profile: ProfileLike
  onSaved?: () => void
  submitLabel?: string
}) {
  const [accountType, setAccountType] = useState<"owner" | "broker" | null>(profile.account_type)
  const [fullName, setFullName] = useState(profile.full_name || "")
  const [phone, setPhone] = useState(profile.phone ? `0${profile.phone.replace(/^\+20/, "")}` : "")
  const [whatsapp, setWhatsapp] = useState(
    profile.whatsapp && profile.whatsapp !== profile.phone ? `0${profile.whatsapp.replace(/^\+20/, "")}` : "",
  )
  const [officeName, setOfficeName] = useState(profile.office_name || "")
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [pending, start] = useTransition()

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!accountType) {
      setErrors({ account_type: tr(lng, "اختر نوع الحساب", "Choose an account type") })
      return
    }
    start(async () => {
      const res = await saveProfile(
        { account_type: accountType, full_name: fullName, phone, whatsapp, office_name: officeName },
        lng,
      )
      if (res.success) {
        setErrors({})
        toast.success(tr(lng, "تم حفظ بياناتك", "Your details were saved"))
        onSaved?.()
      } else {
        setErrors(res.fieldErrors || {})
        if (res.message) toast.error(res.message)
      }
    })
  }

  const typeButton = (value: "owner" | "broker", Icon: typeof Home, title: string, body: string) => (
    <button
      type="button"
      onClick={() => setAccountType(value)}
      className={cn(
        "flex-1 rounded-lg border-2 p-4 text-start transition-colors",
        accountType === value ? "border-primary bg-primary/5" : "border-border hover:border-primary/50",
      )}
      aria-pressed={accountType === value}
    >
      <Icon className="w-6 h-6 mb-2 text-primary" />
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-muted-foreground mt-1">{body}</div>
    </button>
  )

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <Label className="mb-2 block">{tr(lng, "أنا", "I am")}</Label>
        <div className="flex gap-3">
          {typeButton("owner", Home, tr(lng, "مالك", "An owner"), tr(lng, "أعرض عقاري الخاص (حتى 5 إعلانات مجاناً)", "Listing my own property (up to 5 free listings)"))}
          {typeButton("broker", Building2, tr(lng, "وسيط", "A broker"), tr(lng, "أعرض عقارات عملائي (حتى 30 إعلاناً مجاناً)", "Listing for clients (up to 30 free listings)"))}
        </div>
        {errors.account_type && <p className="text-sm text-destructive mt-1">{errors.account_type}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="acc-name">{tr(lng, "الاسم", "Name")}</Label>
        <Input id="acc-name" value={fullName} onChange={(e) => setFullName(e.target.value)} required minLength={2} maxLength={80} />
      </div>

      {accountType === "broker" && (
        <div className="space-y-1">
          <Label htmlFor="acc-office">{tr(lng, "اسم المكتب أو الشركة", "Office or company name")}</Label>
          <Input id="acc-office" value={officeName} onChange={(e) => setOfficeName(e.target.value)} maxLength={120} />
          {errors.office_name && <p className="text-sm text-destructive">{errors.office_name}</p>}
        </div>
      )}

      <div className="space-y-1">
        <Label htmlFor="acc-phone">{tr(lng, "رقم الموبايل", "Mobile number")}</Label>
        <Input
          id="acc-phone"
          type="tel"
          inputMode="tel"
          dir="ltr"
          placeholder="01001234567"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />
        <p className="text-xs text-muted-foreground">{tr(lng, "يظهر للمشترين على إعلاناتك ليتواصلوا معك.", "Shown to buyers on your listings so they can reach you.")}</p>
        {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
      </div>

      <div className="space-y-1">
        <Label htmlFor="acc-wa">{tr(lng, "رقم واتساب (لو مختلف)", "WhatsApp number (if different)")}</Label>
        <Input id="acc-wa" type="tel" inputMode="tel" dir="ltr" placeholder="01001234567" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} />
        {errors.whatsapp && <p className="text-sm text-destructive">{errors.whatsapp}</p>}
      </div>

      <Button type="submit" className="w-full" size="lg" disabled={pending}>
        {pending ? tr(lng, "جارٍ الحفظ…", "Saving…") : submitLabel || tr(lng, "حفظ ومتابعة", "Save and continue")}
      </Button>
    </form>
  )
}

export function OnboardingDialog({
  lng,
  open,
  onOpenChange,
  profile,
  onSaved,
}: {
  lng: string
  open: boolean
  onOpenChange: (open: boolean) => void
  profile: ProfileLike
  onSaved: () => void
}) {
  const [key, setKey] = useState(0)
  useEffect(() => {
    if (open) setKey((k) => k + 1)
  }, [open])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto" dir={lng === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{tr(lng, "أكمل بيانات حسابك", "Complete your account")}</DialogTitle>
          <DialogDescription>{tr(lng, "خطوة واحدة قبل نشر أول إعلان.", "One step before your first listing.")}</DialogDescription>
        </DialogHeader>
        <AccountForm key={key} lng={lng} profile={profile} onSaved={onSaved} />
      </DialogContent>
    </Dialog>
  )
}
