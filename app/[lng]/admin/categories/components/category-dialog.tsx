"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, Image as ImageIcon, X } from "lucide-react"
import { createCategory, updateCategory } from "@/lib/actions/categories"
import { toast } from "sonner"
import { Dictionary } from "@/lib/i18n/types"
import Image from "next/image"
import { CategoryImageUpload, CategoryImage } from "@/components/admin/category-image-upload"

interface Category {
  id: string
  name: string
  description: string | null
  order_index: number | null
  image_url?: string | null
  slug?: string
  name_en?: string | null
  name_ar?: string | null
  description_en?: string | null
  description_ar?: string | null
}

interface CategoryDialogProps {
  lng: string
  mode: "create" | "edit"
  category?: Category
  children: React.ReactNode
  dict: Dictionary
}

export function CategoryDialog({ lng, mode, category, children, dict }: CategoryDialogProps) {
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [formData, setFormData] = useState({
    name_en: category?.name_en || category?.name || "",
    name_ar: category?.name_ar || "",
    description_en: category?.description_en || category?.description || "",
    description_ar: category?.description_ar || "",
    image_url: category?.image_url || "",
  })
  const [categoryImage, setCategoryImage] = useState<CategoryImage | null>(
    category?.image_url ? {
      id: category.id,
      url: category.image_url,
      alt_text: null
    } : null
  )
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  const handleImageChange = (image: CategoryImage | null) => {
    setCategoryImage(image)
    setFormData(prev => ({ 
      ...prev, 
      image_url: image?.url || "" 
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      formDataObj.append("name_en", formData.name_en)
      formDataObj.append("name_ar", formData.name_ar)
      formDataObj.append("description_en", formData.description_en)
      formDataObj.append("description_ar", formData.description_ar)
      formDataObj.append("image_url", formData.image_url || "") // Pass existing URL

      if (categoryImage?.file) {
        formDataObj.append("image", categoryImage.file)
      }

      try {
        let result
        if (mode === "create") {
          result = await createCategory({ errors: {}, message: "", success: false }, formDataObj)
        } else if (category) {
          result = await updateCategory(category.id, { errors: {}, message: "", success: false }, formDataObj)
        }

        if (result?.success) {
          toast.success(result.message)
          setOpen(false)
          setFormData({ name_en: "", name_ar: "", description_en: "", description_ar: "", image_url: "" })
          setCategoryImage(null)
          setErrors({})
        } else {
          if (result?.errors) {
            setErrors(result.errors)
          }
          toast.error(result?.message || dict.admin.categories.dialog.anErrorOccurred)
        }
      } catch (error) {
        toast.error(dict.admin.categories.dialog.unexpectedError)
      }
    })
  }

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: [] }))
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? dict.admin.categories.dialog.addTitle : dict.admin.categories.dialog.editTitle}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Image Upload Section - Compact */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">{dict.admin.categories.dialog.imageLabel}</Label>
            <div className="bg-gray-50 p-4 rounded-lg">
              <CategoryImageUpload
                image={categoryImage}
                onImageChange={handleImageChange}
                cropAspectRatio={16/9}
              />
            </div>
          </div>

          {/* Names Section - Side by Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Category Names</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name_en" className="text-sm font-medium">English Name *</Label>
                <Input
                  id="name_en"
                  value={formData.name_en}
                  onChange={(e) => handleInputChange("name_en", e.target.value)}
                  placeholder="Enter category name in English"
                  className={`${errors.name_en ? "border-red-500" : ""}`}
                  disabled={isPending}
                  required
                />
                {errors.name_en && <p className="text-xs text-red-500">{errors.name_en[0]}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="name_ar" className="text-sm font-medium">Arabic Name *</Label>
                <Input
                  id="name_ar"
                  value={formData.name_ar}
                  onChange={(e) => handleInputChange("name_ar", e.target.value)}
                  placeholder="أدخل اسم الفئة بالعربية"
                  className={`${errors.name_ar ? "border-red-500" : ""}`}
                  disabled={isPending}
                  required
                  dir="rtl"
                />
                {errors.name_ar && <p className="text-xs text-red-500">{errors.name_ar[0]}</p>}
              </div>
            </div>
          </div>

          {/* Descriptions Section - Side by Side */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 border-b pb-2">Category Descriptions</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="description_en" className="text-sm font-medium">English Description</Label>
                <Textarea
                  id="description_en"
                  value={formData.description_en}
                  onChange={(e) => handleInputChange("description_en", e.target.value)}
                  placeholder="Enter category description in English"
                  className={`resize-none ${errors.description_en ? "border-red-500" : ""}`}
                  disabled={isPending}
                  rows={3}
                />
                {errors.description_en && <p className="text-xs text-red-500">{errors.description_en[0]}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description_ar" className="text-sm font-medium">Arabic Description</Label>
                <Textarea
                  id="description_ar"
                  value={formData.description_ar}
                  onChange={(e) => handleInputChange("description_ar", e.target.value)}
                  placeholder="أدخل وصف الفئة بالعربية"
                  className={`resize-none ${errors.description_ar ? "border-red-500" : ""}`}
                  disabled={isPending}
                  rows={3}
                  dir="rtl"
                />
                {errors.description_ar && <p className="text-xs text-red-500">{errors.description_ar[0]}</p>}
              </div>
            </div>
          </div>

          {/* Action Buttons - Responsive */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-3 pt-6 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {dict.admin.categories.cancel}
            </Button>
            <Button 
              type="submit" 
              disabled={isPending}
              className="w-full sm:w-auto"
            >
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? dict.admin.categories.dialog.creating : dict.admin.categories.dialog.updating}
                </>
              ) : (
                mode === "create" ? dict.admin.categories.dialog.createButton : dict.admin.categories.dialog.updateButton
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}