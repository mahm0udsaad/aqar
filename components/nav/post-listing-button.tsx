"use client"

import { Plus } from "lucide-react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/lib/auth/auth-context"
import { cn } from "@/lib/utils"

/** "+ أضف عقارك مجاناً": signs the visitor in / finishes setup first, then opens the wizard. */
export function PostListingButton({ lng, className, floating = false }: { lng: string; className?: string; floating?: boolean }) {
  const router = useRouter()
  const { requireAccount } = useAuth()
  const target = `/${lng}/listings/new`
  const go = () => {
    requireAccount(() => router.push(target), `${process.env.NEXT_PUBLIC_BASE_PATH || ""}${target}`)
  }

  if (floating) {
    return (
      <Button
        onClick={go}
        size="lg"
        className={cn("fixed bottom-5 z-40 shadow-lg rounded-full h-14 px-5 gap-2 font-semibold md:hidden", lng === "ar" ? "left-5" : "right-5", className)}
      >
        <Plus className="h-5 w-5" />
        {lng === "ar" ? "أضف عقار" : "List property"}
      </Button>
    )
  }
  return (
    <Button onClick={go} size="sm" className={cn("gap-1 font-semibold", className)}>
      <Plus className="h-4 w-4" />
      {lng === "ar" ? "أضف عقارك مجاناً" : "List your property free"}
    </Button>
  )
}
