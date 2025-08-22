"use client"

import { useEffect, useState, useTransition } from "react"
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
import { Loader2, Upload, Image as ImageIcon } from "lucide-react"
import { uploadImages } from "@/lib/actions/uploads"
import { AreaImageCrop } from "@/components/admin/area-image-crop"

interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number | null
  is_active: boolean | null
  image_url?: string | null
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
    imageUrl: area?.image_url || "",
  })
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [cropDialogOpen, setCropDialogOpen] = useState(false)

  const resetForm = () => {
    setFormData({
      name: area?.name || "",
      description: area?.description || "",
      orderIndex: area?.order_index?.toString() || "",
      isActive: area?.is_active ?? true,
      imageUrl: area?.image_url || "",
    })
    setErrors({})
    setSelectedFile(null)
    setCropDialogOpen(false)
  }

  const handleCropSave = (imageUrl: string) => {
    setFormData(prev => ({ ...prev, imageUrl }))
    setSelectedFile(null)
    setCropDialogOpen(false)
  }

  // Ensure dialog fields are populated when opening to edit an area
  useEffect(() => {
    if (open) {
      setFormData({
        name: area?.name || "",
        description: area?.description || "",
        orderIndex: area?.order_index?.toString() || "",
        isActive: area?.is_active ?? true,
        imageUrl: area?.image_url || "",
      })
      setErrors({})
      setSelectedFile(null)
      setCropDialogOpen(false)
    }
  }, [area, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("name", formData.name)
      formDataObj.append("description", formData.description)
      formDataObj.append("orderIndex", formData.orderIndex)
      formDataObj.append("isActive", formData.isActive.toString())
      formDataObj.append("imageUrl", formData.imageUrl)

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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {area ? `Edit ${area.name}` : "Create New Area"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Section - Enhanced with Crop */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Area Image</Label>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1 space-y-2">
                <Input
                  value={formData.imageUrl}
                  onChange={(e) => handleInputChange("imageUrl", e.target.value)}
                  placeholder="Paste image URL"
                  className="text-sm"
                />
                <div className="flex gap-2">
                  <input
                    type="file"
                    id="area-image-upload"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      
                      // Validate file type
                      if (!file.type.startsWith('image/')) {
                        toast.error('Please select a valid image file')
                        return
                      }
                      
                      // Validate file size (max 10MB)
                      if (file.size > 10 * 1024 * 1024) {
                        toast.error('File size must be less than 10MB')
                        return
                      }
                      
                      setSelectedFile(file)
                      setCropDialogOpen(true)
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => document.getElementById('area-image-upload')?.click()}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Upload & Crop Image
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Supports JPG, PNG, WebP. Max 10MB. Image will be cropped before upload.
                </p>
              </div>
              {formData.imageUrl && (
                <div className="w-full sm:w-24 flex-shrink-0">
                  <div className="relative">
                    <img 
                      src={formData.imageUrl} 
                      alt="Area preview" 
                      className="w-full sm:w-24 h-16 sm:h-16 rounded-md object-cover border"
                    />
                    <div className="absolute -top-2 -right-2">
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="h-6 w-6 p-0 rounded-full"
                        onClick={() => handleInputChange("imageUrl", "")}
                      >
                        ×
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name and Order Index - Horizontal Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2">
              <Label htmlFor="name" className="text-sm font-medium">Area Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="e.g., New Cairo"
                className={`mt-1 ${errors.name ? "border-red-500" : ""}`}
              />
              {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name[0]}</p>}
            </div>
            
            <div>
              <Label htmlFor="orderIndex" className="text-sm font-medium">Order</Label>
              <Input
                id="orderIndex"
                type="number"
                value={formData.orderIndex}
                onChange={(e) => handleInputChange("orderIndex", e.target.value)}
                placeholder="1"
                min="0"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Display order
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description" className="text-sm font-medium">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              placeholder="Brief description of the area..."
              rows={2}
              className="mt-1 resize-none"
            />
          </div>

          {/* Active Switch - Compact */}
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div>
              <Label htmlFor="isActive" className="text-sm font-medium cursor-pointer">
                Active Status
              </Label>
              <p className="text-xs text-muted-foreground">
                {formData.isActive ? "Visible to users" : "Hidden from users"}
              </p>
            </div>
            <Switch
              id="isActive"
              checked={formData.isActive}
              onCheckedChange={(checked) => handleInputChange("isActive", checked)}
            />
          </div>

          {/* Action Buttons - Responsive */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full sm:w-auto"
            >
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
        
        {/* Crop Dialog */}
        <AreaImageCrop
          file={selectedFile}
          isOpen={cropDialogOpen}
          onClose={() => {
            setCropDialogOpen(false)
            setSelectedFile(null)
          }}
          onSave={handleCropSave}
        />
      </DialogContent>
    </Dialog>
  )
}