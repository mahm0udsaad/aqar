"use client"

import { useState } from "react"
import { Heart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useFavorites } from "@/contexts/favorites-context"

interface LoveButtonProps {
  propertyId: string
  className?: string
  showText?: boolean
  size?: "sm" | "default" | "lg"
  lng?: string
}

/** Heart button: saves the listing to the signed-in account (visitors get the sign-in popup). */
export function LoveButton({ propertyId, className, showText = false, size = "default", lng = "ar" }: LoveButtonProps) {
  const { isFavorite, toggle } = useFavorites()
  const [busy, setBusy] = useState(false)
  const isLoved = isFavorite(propertyId)

  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"
  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4"
  const label = isLoved ? (lng === "ar" ? "محفوظ في المفضلة" : "Saved") : lng === "ar" ? "حفظ في المفضلة" : "Save"

  return (
    <Button
      onClick={async (e) => {
        e.preventDefault()
        e.stopPropagation()
        setBusy(true)
        await toggle(propertyId)
        setBusy(false)
      }}
      disabled={busy}
      size={buttonSize}
      variant={isLoved ? "default" : "outline"}
      aria-pressed={isLoved}
      aria-label={label}
      title={label}
      className={cn(
        "transition-all duration-200",
        isLoved ? "bg-red-500 hover:bg-red-600 text-white border-red-500" : "hover:bg-red-50 hover:border-red-300 hover:text-red-600",
        className,
      )}
    >
      <Heart className={cn(iconSize, isLoved ? "fill-current" : "", showText ? "me-2" : "")} />
      {showText && label}
    </Button>
  )
}
