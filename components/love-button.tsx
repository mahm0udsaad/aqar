"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"
import { cn } from "@/lib/utils"

interface LoveButtonProps {
  propertyId: string
  className?: string
  showText?: boolean
  size?: "sm" | "default" | "lg"
}

export function LoveButton({ propertyId, className, showText = false, size = "default" }: LoveButtonProps) {
  const [isLoved, setIsLoved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Load loved properties from localStorage on mount
  useEffect(() => {
    const lovedProperties = JSON.parse(localStorage.getItem("lovedProperties") || "[]")
    setIsLoved(lovedProperties.includes(propertyId))
  }, [propertyId])

  const toggleLove = async () => {
    setIsLoading(true)

    try {
      const lovedProperties = JSON.parse(localStorage.getItem("lovedProperties") || "[]")
      let updatedLovedProperties

      if (isLoved) {
        // Remove from loved properties
        updatedLovedProperties = lovedProperties.filter((id: string) => id !== propertyId)
      } else {
        // Add to loved properties
        updatedLovedProperties = [...lovedProperties, propertyId]
      }

      localStorage.setItem("lovedProperties", JSON.stringify(updatedLovedProperties))
      setIsLoved(!isLoved)

      // Dispatch custom event to notify other components
      window.dispatchEvent(
        new CustomEvent("lovedPropertiesChanged", {
          detail: { propertyId, isLoved: !isLoved },
        }),
      )
    } catch (error) {
      console.error("Error updating loved properties:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const buttonSize = size === "sm" ? "sm" : size === "lg" ? "lg" : "default"
  const iconSize = size === "sm" ? "w-3 h-3" : size === "lg" ? "w-6 h-6" : "w-4 h-4"

  return (
    <Button
      onClick={toggleLove}
      disabled={isLoading}
      size={buttonSize}
      variant={isLoved ? "default" : "outline"}
      className={cn(
        "transition-all duration-200",
        isLoved
          ? "bg-red-500 hover:bg-red-600 text-white border-red-500"
          : "hover:bg-red-50 hover:border-red-300 hover:text-red-600",
        className,
      )}
    >
      <Heart className={cn(iconSize, isLoved ? "fill-current" : "", showText ? "mr-2" : "")} />
      {showText && (isLoved ? "Loved" : "Love")}
    </Button>
  )
}
