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

const ratingSchema = z.object({
  areaId: z.string(),
  overallRating: z.number().min(1).max(5),
  schoolsRating: z.number().min(1).max(5).optional(),
  transportationRating: z.number().min(1).max(5).optional(),
  shoppingRating: z.number().min(1).max(5).optional(),
  restaurantsRating: z.number().min(1).max(5).optional(),
  safetyRating: z.number().min(1).max(5).optional(),
  quietnessRating: z.number().min(1).max(5).optional(),
  walkabilityRating: z.number().min(1).max(5).optional(),
  nightlifeRating: z.number().min(1).max(5).optional(),
  healthcareRating: z.number().min(1).max(5).optional(),
  parksRating: z.number().min(1).max(5).optional(),
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
          onClick={() => !readonly && onChange(star)}
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

const ratingCategories = [
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
    if (isOpen && areaId) {
      getUserAreaRating(areaId).then((rating) => {
        if (rating) {
          setExistingRating(rating)
          // Populate form with existing values
          setValue("overallRating", rating.overall_rating)
          if (rating.schools_rating) setValue("schoolsRating", rating.schools_rating)
          if (rating.transportation_rating) setValue("transportationRating", rating.transportation_rating)
          if (rating.shopping_rating) setValue("shoppingRating", rating.shopping_rating)
          if (rating.restaurants_rating) setValue("restaurantsRating", rating.restaurants_rating)
          if (rating.safety_rating) setValue("safetyRating", rating.safety_rating)
          if (rating.quietness_rating) setValue("quietnessRating", rating.quietness_rating)
          if (rating.walkability_rating) setValue("walkabilityRating", rating.walkability_rating)
          if (rating.nightlife_rating) setValue("nightlifeRating", rating.nightlife_rating)
          if (rating.healthcare_rating) setValue("healthcareRating", rating.healthcare_rating)
          if (rating.parks_rating) setValue("parksRating", rating.parks_rating)
          if (rating.comment) setValue("comment", rating.comment)
        }
      })
    }
  }, [isOpen, areaId, setValue])

  const onSubmit = async (data: RatingFormData) => {
    setIsSubmitting(true)
    
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, value.toString())
        }
      })

      const result = await createOrUpdateAreaRating({}, formData)
      
      if (result.success) {
        toast.success(result.message)
        onRatingSubmitted?.()
        onClose()
        reset()
      } else {
        toast.error(result.errors?._form?.[0] || "Failed to submit rating")
      }
    } catch (error) {
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
          <input type="hidden" {...register("areaId")} value={areaId} />
          
          {/* Rating Categories */}
          <div className="space-y-4">
            {ratingCategories.map((category) => (
              <div key={category.key} className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{category.icon}</span>
                    {category.label}
                    {category.required && <span className="text-red-500">*</span>}
                  </label>
                  <div className="flex items-center gap-2">
                    <StarRating
                      value={watchedValues[category.key as keyof RatingFormData] as number || 0}
                      onChange={(value) => setValue(category.key as keyof RatingFormData, value)}
                    />
                    <span className="text-sm text-muted-foreground min-w-[2rem]">
                      {watchedValues[category.key as keyof RatingFormData] || "—"}
                    </span>
                  </div>
                </div>
                {errors[category.key as keyof RatingFormData] && (
                  <p className="text-sm text-red-500">
                    {errors[category.key as keyof RatingFormData]?.message}
                  </p>
                )}
              </div>
            ))}
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
                  value={watchedValues.overallRating || 0}
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