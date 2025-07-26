"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { createArea, updateArea } from "@/lib/actions/areas"
import { toast } from "sonner"
import { Loader2 } from "lucide-react"

interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number | null
  is_active: boolean | null
}

interface AreaDialogProps {
  area?: Area | null
  open: boolean
  onOpenChange: (open: boolean) => void
  lng: string
  dict: any
}

export function AreaDialog({ area, open, onOpenChange, lng, dict }: AreaDialogProps) {
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name: area?.name || "",
    description: area?.description || "",
    orderIndex: area?.order_index?.toString() || "",
    isActive: area?.is_active ?? true,
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const resetForm = () => {
    setFormData({
      name: area?.name || "",
      description: area?.description || "",
      orderIndex: area?.order_index?.toString() || "",
      isActive: area?.is_active ?? true,
    })
    setErrors({})
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("description", formData.description)
      formDataObj.append("orderIndex", formData.orderIndex)
      formDataObj.append("isActive", formData.isActive.toString())

      try {
        let result
        if (area) {
          result = await updateArea(area.id, { errors: {}, message: "", success: false }, formDataObj)
        } else {
          result = await createArea({ errors: {}, message: "", success: false }, formDataObj)
        }

        if (result.success) {
          toast.success(result.message)
          onOpenChange(false)
          resetForm()
          window.location.reload()
        } else {
          if (result.errors) {
            setErrors(result.errors)
          }
          toast.error(result.message || "An error occurred")
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
      }
    })
  }

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {area ? `Edit ${area.name}` : "Create New Area"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Area Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              placeholder="e.g., New Cairo"
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && <p className="text-sm text-red-500 mt-1">{errors.name[0]}</p>}
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the area..."
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="orderIndex">Display Order</Label>
            <Input
              id="orderIndex"
              type="number"
              value={formData.orderIndex}
              onChange={(e) => handleInputChange("orderIndex", e.target.value)}
              placeholder="e.g., 1"
              min="0"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Lower numbers appear first in lists
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
            />
            <Label htmlFor="isActive">Active (visible to users)</Label>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {area ? "Updating..." : "Creating..."}
                </>
              ) : (
                area ? "Update Area" : "Create Area"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
} 