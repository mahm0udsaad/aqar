"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Star, StarOff, Loader2 } from "lucide-react"
import { togglePropertyFeatured } from "@/lib/actions/properties"
import { toast } from "sonner"
import { Dictionary } from "@/lib/i18n/types"
import { useRouter } from "next/navigation"

interface ToggleFeaturedButtonProps {
  propertyId: string
  isFeatured: boolean
  dict: Dictionary
  onToggled?: (newIsFeatured: boolean) => void
}

export function ToggleFeaturedButton({ propertyId, isFeatured, dict, onToggled }: ToggleFeaturedButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  const handleToggle = () => {
    startTransition(async () => {
      try {
        // Optimistic update
        onToggled?.(!isFeatured)

        const result = await togglePropertyFeatured(propertyId, !isFeatured)
        
        if (result.success) {
          toast.success(result.message)
          // Sync any server components without a full reload
          router.refresh()
        } else {
          // Revert optimistic update on failure
          onToggled?.(isFeatured)
          toast.error(result.message)
        }
      } catch (error) {
        // Revert optimistic update on error
        onToggled?.(isFeatured)
        toast.error(dict.admin.featured.toggleError)
      }
    })
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggle}
            disabled={isPending}
            className={isFeatured ? "text-yellow-600 hover:text-yellow-700" : "text-gray-400 hover:text-yellow-600"}
          >
            {isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : isFeatured ? (
              <Star className="w-4 h-4 fill-current" />
            ) : (
              <StarOff className="w-4 h-4" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          {isFeatured ? "Remove from Featured" : "Add to Featured"}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
} 