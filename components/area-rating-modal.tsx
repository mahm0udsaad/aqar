"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Star, MapPin, Users } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"
import {
  createOrUpdateAreaRating,
  getUserAreaRating,
  type AreaRatingFormData,
  type AreaRatingActionState,
} from "@/lib/actions/area-ratings"

// Enhanced validation with better number handling - SIMPLIFIED
const optionalStar = z
  .number()
  .min(1)
  .max(5)
  .optional()

const requiredStar = z
  .number()
  .min(1, "Rating must be at least 1")
  .max(5, "Rating must be at most 5")

const ratingSchema = z.object({
  areaId: z.string(),
  overallRating: requiredStar,
  schoolsRating: optionalStar,
  transportationRating: optionalStar,
  shoppingRating: optionalStar,
  restaurantsRating: optionalStar,
  safetyRating: optionalStar,
  quietnessRating: optionalStar,
  walkabilityRating: optionalStar,
  nightlifeRating: optionalStar,
  healthcareRating: optionalStar,
  parksRating: optionalStar,
  comment: z.string().max(1000).optional(),
})

type RatingFormData = z.infer<typeof ratingSchema>

interface AreaRatingModalProps {
  isOpen: boolean
  onClose: () => void
  areaId: string
  areaName: string
  onRatingSubmitted?: () => void
}

interface StarRatingProps {
  value: number
  onChange: (value: number) => void
  size?: "sm" | "md" | "lg"
  readonly?: boolean
}

function StarRating({ value, onChange, size = "md", readonly = false }: StarRatingProps) {
  const [hover, setHover] = useState(0)
  
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  const handleStarClick = (star: number) => {
    if (!readonly) {
      // Ensure we're passing a proper number
      const numericValue = Number(star)
      onChange(numericValue)
    }
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          disabled={readonly}
          className={`${sizeClasses[size]} transition-colors ${
            readonly ? "cursor-default" : "cursor-pointer hover:scale-110"
          }`}
          onClick={() => handleStarClick(star)}
          onMouseEnter={() => !readonly && setHover(star)}
          onMouseLeave={() => !readonly && setHover(0)}
        >
          <Star
            className={`w-full h-full ${
              star <= (hover || value)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        </button>
      ))}
    </div>
  )
}

type RatingCategory = {
  key:
    | "overallRating"
    | "schoolsRating"
    | "transportationRating"
    | "shoppingRating"
    | "restaurantsRating"
    | "safetyRating"
    | "quietnessRating"
    | "walkabilityRating"
    | "nightlifeRating"
    | "healthcareRating"
    | "parksRating"
  label: string
  icon: string
  required?: boolean
}

const ratingCategories: Readonly<RatingCategory[]> = [
  { key: "overallRating", label: "Overall Experience", icon: "⭐", required: true },
  { key: "schoolsRating", label: "Schools & Education", icon: "🎓" },
  { key: "transportationRating", label: "Transportation", icon: "🚌" },
  { key: "shoppingRating", label: "Shopping & Retail", icon: "🛍️" },
  { key: "restaurantsRating", label: "Restaurants & Dining", icon: "🍽️" },
  { key: "safetyRating", label: "Safety & Security", icon: "🛡️" },
  { key: "quietnessRating", label: "Quietness", icon: "🔇" },
  { key: "walkabilityRating", label: "Walkability", icon: "🚶" },
  { key: "nightlifeRating", label: "Nightlife & Entertainment", icon: "🌃" },
  { key: "healthcareRating", label: "Healthcare", icon: "🏥" },
  { key: "parksRating", label: "Parks & Recreation", icon: "🌳" },
] as const

export function AreaRatingModal({ 
  isOpen, 
  onClose, 
  areaId, 
  areaName,
  onRatingSubmitted 
}: AreaRatingModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [existingRating, setExistingRating] = useState<any>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors }
  } = useForm<RatingFormData>({
    resolver: zodResolver(ratingSchema),
    defaultValues: {
      areaId,
      overallRating: 5,
    }
  })

  const watchedValues = watch()

  // Load existing rating when modal opens
  useEffect(() => {
    // keep areaId in sync with prop
    if (areaId) {
      setValue("areaId", areaId)
    }
    if (isOpen && areaId) {
      getUserAreaRating(areaId).then((rating: any) => {
        if (rating) {
          setExistingRating(rating)
          // Populate form with existing values - ensure all are numbers
          setValue("overallRating", Number(rating.overall_rating))
          if (rating.schools_rating) setValue("schoolsRating", Number(rating.schools_rating))
          if (rating.transportation_rating) setValue("transportationRating", Number(rating.transportation_rating))
          if (rating.shopping_rating) setValue("shoppingRating", Number(rating.shopping_rating))
          if (rating.restaurants_rating) setValue("restaurantsRating", Number(rating.restaurants_rating))
          if (rating.safety_rating) setValue("safetyRating", Number(rating.safety_rating))
          if (rating.quietness_rating) setValue("quietnessRating", Number(rating.quietness_rating))
          if (rating.walkability_rating) setValue("walkabilityRating", Number(rating.walkability_rating))
          if (rating.nightlife_rating) setValue("nightlifeRating", Number(rating.nightlife_rating))
          if (rating.healthcare_rating) setValue("healthcareRating", Number(rating.healthcare_rating))
          if (rating.parks_rating) setValue("parksRating", Number(rating.parks_rating))
          if (rating.comment) setValue("comment", rating.comment)
        }
      })
    }
  }, [isOpen, areaId, setValue])

  const onSubmit = async (data: RatingFormData) => {
    
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      
      // Always include areaId
      formData.append("areaId", areaId)
      
      // CRITICAL FIX: Only include ratings that are actually set (not 0, null, undefined, or empty)
      const numericKeys: Array<keyof RatingFormData> = [
        "overallRating",
        "schoolsRating",
        "transportationRating",
        "shoppingRating",
        "restaurantsRating",
        "safetyRating",
        "quietnessRating",
        "walkabilityRating",
        "nightlifeRating",
        "healthcareRating",
        "parksRating",
      ]
      
      numericKeys.forEach((k) => {
        const v = data[k]
        
        // FIXED: Check if value is actually set and valid
        if (v !== undefined && v !== null && v !== 0 && v !== '') {
          const numValue = Number(v)
          if (Number.isFinite(numValue) && numValue >= 1 && numValue <= 5) {
            formData.append(String(k), String(numValue))
          }
        } else {
          // CRITICAL: Don't append anything for unset optional fields
          // This ensures the server receives nothing instead of empty strings
        }
      })
      
      if (data.comment && data.comment.trim()) {
        formData.append("comment", data.comment.trim())
      }

      // Log all FormData entries
      for (const [key, value] of formData.entries()) {
      }

      const result = await createOrUpdateAreaRating({}, formData)
      
      if (result.success) {
        toast.success(result.message)
        onRatingSubmitted?.()
        onClose()
        reset()
      } else {
        console.error("❌ Server errors:", result.errors)
        const firstFieldError = result.errors
          ? Object.entries(result.errors)
              .filter(([key]) => key !== "_form")
              .flatMap(([, msgs]) => msgs || [])
              .find(Boolean)
          : undefined
        toast.error(result.errors?._form?.[0] || firstFieldError || "Failed to submit rating")
      }
    } catch (error) {
      console.error("💥 Unexpected error:", error)
      toast.error("An unexpected error occurred")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    reset()
    setExistingRating(null)
    onClose()
  }

  const handleRatingChange = (category: keyof RatingFormData, value: number) => {
    
    // Ensure value is a proper number
    const numericValue = Number(value)
    if (isNaN(numericValue)) {
      console.error(`❌ Invalid rating value for ${category}:`, value)
      return
    }
    
    
    // For optional ratings, if the value is the same as current, clear it (toggle behavior)
    const currentValue = Number(watchedValues[category])
    if (category !== 'overallRating' && currentValue === numericValue) {
      setValue(category, undefined as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
    } else {
      setValue(category, numericValue as any, {
        shouldValidate: true,
        shouldDirty: true,
      })
    }
    
    // Verify the value was set correctly
    setTimeout(() => {
      const newValue = watchedValues[category]
    }, 0)
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Rate {areaName}
          </DialogTitle>
          <DialogDescription>
            {existingRating 
              ? "Update your rating for this area. Your feedback helps others make informed decisions."
              : "Share your experience living in this area. Your feedback helps others make informed decisions."
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <input type="hidden" {...register("areaId")} />
          
          {/* Rating Categories */}
          <div className="space-y-4">
            {ratingCategories.map((category) => {
              const currentValue = Number(watchedValues[category.key as keyof RatingFormData]) || 0
              
              return (
                <div key={category.key} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      {category.label}
                      {category.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="flex items-center gap-2">
                      <StarRating
                        value={currentValue}
                        onChange={(value) => handleRatingChange(category.key as keyof RatingFormData, value)}
                      />
                      <span className="text-sm text-muted-foreground min-w-[2rem]">
                        {currentValue || "—"}
                      </span>
                    </div>
                  </div>
                  {errors[category.key as keyof RatingFormData] && (
                    <p className="text-sm text-red-500">
                      {errors[category.key as keyof RatingFormData]?.message}
                    </p>
                  )}
                </div>
              )
            })}
          </div>

          <Separator />

          {/* Comment Section */}
          <div className="space-y-2">
            <label htmlFor="comment" className="text-sm font-medium">
              Additional Comments (Optional)
            </label>
            <Textarea
              id="comment"
              placeholder="Share more details about your experience in this area..."
              {...register("comment")}
              className="min-h-[100px]"
            />
            {errors.comment && (
              <p className="text-sm text-red-500">{errors.comment.message}</p>
            )}
          </div>

          {/* Rating Summary */}
          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Your Rating Summary
            </h4>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">
                  {watchedValues.overallRating || "—"}
                </span>
                <StarRating
                  value={Number(watchedValues.overallRating) || 0}
                  onChange={() => {}}
                  readonly
                  size="sm"
                />
              </div>
              <Badge variant="secondary">
                {existingRating ? "Updating Rating" : "New Rating"}
              </Badge>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting 
                ? "Submitting..." 
                : existingRating 
                  ? "Update Rating" 
                  : "Submit Rating"
              }
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}