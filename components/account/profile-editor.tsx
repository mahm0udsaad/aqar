"use client"

import { useRouter } from "next/navigation"
import { AccountForm } from "@/components/auth/onboarding-dialog"
import { useAuth } from "@/lib/auth/auth-context"
import { tr } from "@/lib/listing-options"

export function ProfileEditor({ lng, profile }: { lng: string; profile: Parameters<typeof AccountForm>[0]["profile"] }) {
  const router = useRouter()
  const { refresh } = useAuth()
  return (
    <AccountForm
      lng={lng}
      profile={profile}
      submitLabel={tr(lng, "حفظ التغييرات", "Save changes")}
      onSaved={() => {
        refresh()
        router.refresh()
      }}
    />
  )
}
