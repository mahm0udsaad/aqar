"use client"

import { useState, useEffect } from "react"
import { Star, MapPin, Users, MessageSquare, Plus } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import { getRatingColor } from "@/lib/utils"
import { getAreaRatingsSummary } from "@/lib/actions/area-ratings"
import { AreaRatingModal } from "@/components/area-rating-modal"

interface AreaRatingsDisplayProps {
  areaId: string
  areaName: string | null
  showAddButton?: boolean
}

interface RatingSummary {
  area_id: string
  total_ratings: number
  avg_overall_rating: number | null
  avg_schools_rating: number | null
  avg_transportation_rating: number | null
  avg_shopping_rating: number | null
  avg_restaurants_rating: number | null
  avg_safety_rating: number | null
  avg_quietness_rating: number | null
  avg_walkability_rating: number | null
  avg_nightlife_rating: number | null
  avg_healthcare_rating: number | null
  avg_parks_rating: number | null
}

const ratingCategories = [
  { key: "avg_schools_rating", label: "Schools & Education", icon: "🎓" },
  { key: "avg_transportation_rating", label: "Transportation", icon: "🚌" },
  { key: "avg_shopping_rating", label: "Shopping & Retail", icon: "🛍️" },
  { key: "avg_restaurants_rating", label: "Restaurants & Dining", icon: "🍽️" },
  { key: "avg_safety_rating", label: "Safety & Security", icon: "🛡️" },
  { key: "avg_quietness_rating", label: "Quietness", icon: "🔇" },
  { key: "avg_walkability_rating", label: "Walkability", icon: "🚶" },
  { key: "avg_nightlife_rating", label: "Nightlife & Entertainment", icon: "🌃" },
  { key: "avg_healthcare_rating", label: "Healthcare", icon: "🏥" },
  { key: "avg_parks_rating", label: "Parks & Recreation", icon: "🌳" },
] as const

function StarRating({ value, size = "sm" }: { value: number, size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6"
  }

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= value
              ? "fill-yellow-400 text-yellow-400"
              : "text-gray-300"
          }`}
        />
      ))}
    </div>
  )
}

export function AreaRatingsDisplay({ 
  areaId, 
  areaName, 
  showAddButton = true 
}: AreaRatingsDisplayProps) {
  const [ratingsSummary, setRatingsSummary] = useState<RatingSummary | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const loadRatingsSummary = async () => {
    setIsLoading(true)
    try {
      const summary = await getAreaRatingsSummary(areaId)
      setRatingsSummary(summary)
    } catch (error) {
      console.error("Error loading ratings summary:", error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (areaId) {
      loadRatingsSummary()
    }
  }, [areaId])

  const handleRatingSubmitted = () => {
    loadRatingsSummary()
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Area Ratings
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-3 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!ratingsSummary || ratingsSummary.total_ratings === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Area Ratings
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-6">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center">
              <Star className="w-8 h-8 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-2">No Ratings Yet</h3>
              <p className="text-muted-foreground mb-4">
                Be the first to rate this area and help others make informed decisions.
              </p>
              {showAddButton && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Rating
                </Button>
              )}
            </div>
          </div>
        </CardContent>
        <AreaRatingModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          areaId={areaId}
          areaName={areaName || "Area"}
          onRatingSubmitted={handleRatingSubmitted}
        />
      </Card>
    )
  }

  const overallRating = ratingsSummary.avg_overall_rating || 0

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Area Ratings
            </div>
            {showAddButton && (
              <Button variant="outline" size="sm" onClick={() => setIsModalOpen(true)}>
                <MessageSquare className="w-4 h-4 mr-2" />
                Rate Area
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Overall Rating */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-2">
              <div className="text-4xl font-bold">{overallRating.toFixed(1)}</div>
              <div className="flex flex-col items-center gap-1">
                <StarRating value={Math.round(overallRating)} size="lg" />
                <Badge variant="secondary" className="text-xs">
                  <Users className="w-3 h-3 mr-1" />
                  {ratingsSummary.total_ratings} {ratingsSummary.total_ratings === 1 ? 'rating' : 'ratings'}
                </Badge>
              </div>
            </div>
            <p className="text-muted-foreground">Overall Experience</p>
          </div>

          <Separator />

          {/* Category Ratings */}
          <div className="space-y-4">
            <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">
              Category Breakdown
            </h4>
            <div className="grid grid-cols-1 gap-3">
              {ratingCategories.map((category) => {
                const rating = ratingsSummary[category.key as keyof RatingSummary] as number | null
                if (!rating) return null

                return (
                  <div key={category.key} className="flex items-center justify-between py-2">
                    <div className="flex items-center gap-3 flex-1">
                      <span className="text-lg">{category.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium">{category.label}</span>
                          <span className="text-sm text-muted-foreground">
                            {rating.toFixed(1)}
                          </span>
                        </div>
                        <Progress 
                          value={(rating / 5) * 100} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Rating Distribution hint */}
          <div className="text-center pt-2">
            <p className="text-xs text-muted-foreground">
              Based on {ratingsSummary.total_ratings} community {ratingsSummary.total_ratings === 1 ? 'review' : 'reviews'}
            </p>
          </div>
        </CardContent>
      </Card>

      <AreaRatingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        areaId={areaId}
        areaName={areaName || "Area"}
        onRatingSubmitted={handleRatingSubmitted}
      />
    </>
  )
} 