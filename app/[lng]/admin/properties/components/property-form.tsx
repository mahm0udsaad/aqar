"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Save, FileText, X, Upload, MapPin, Star, Phone, Plus, Info, Loader2, ArrowLeft, Camera } from "lucide-react"
import Link from "next/link"
import { createProperty, updateProperty } from "@/lib/actions/properties"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"
import { ImageUploadCrop, PropertyImage } from "@/components/admin/image-upload-crop"

type Property = Database["public"]["Tables"]["properties"]["Row"]
type PropertyImageDB = Database["public"]["Tables"]["property_images"]["Row"]

interface Category {
  id: string
  name: string
}

interface PropertyFormProps {
  categories: Category[]
  lng: string
  mode: "create" | "edit"
  property?: Property & { property_images?: PropertyImageDB[] }
}

const COMMON_FEATURES = [
  "Air Conditioning",
  "Balcony", 
  "Built-in Wardrobes",
  "Dishwasher",
  "Floorboards",
  "Gas Cooking",
  "Internal Laundry",
  "Pets Allowed",
  "Parking",
  "Garden",
  "Pool Access",
  "Gym Access",
]

const COMMON_AMENITIES = [
  "Swimming Pool",
  "Gym",
  "Security",
  "Parking",
  "Garden",
  "Playground",
  "BBQ Area",
  "Tennis Court",
  "Sauna",
  "Concierge",
  "Elevator",
  "Rooftop Terrace",
]

export function PropertyForm({ categories, lng, mode, property }: PropertyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  // Initialize images from existing property
  const initializeImages = (): PropertyImage[] => {
    if (!property?.property_images) return []
    
    return property.property_images.map((img) => ({
      id: img.id,
      url: img.url,
      alt_text: img.alt_text,
      order_index: img.order_index || 0,
      is_main: img.is_main || false
    }))
  }

  // Form state
  const [images, setImages] = useState<PropertyImage[]>(initializeImages())
  const [formData, setFormData] = useState({
    title: property?.title || "",
    description: property?.description || "",
    price: property?.price?.toString() || "",
    pricePerMeter: property?.price_per_meter?.toString() || "",
    location: property?.location || "",
    area: property?.area || "",
    bedrooms: property?.bedrooms?.toString() || "0",
    bathrooms: property?.bathrooms?.toString() || "0",
    size: property?.size?.toString() || "",
    floor: property?.floor?.toString() || "",
    totalFloors: property?.total_floors?.toString() || "",
    yearBuilt: property?.year_built?.toString() || "",
    categoryId: property?.category_id || "",
    propertyType: property?.property_type || "sale",
    ownerType: property?.owner_type || "owner",
    status: property?.status || "active",
    contactName: property?.contact_name || "",
    contactPhone: property?.contact_phone || "",
    contactWhatsapp: property?.contact_whatsapp || "",
    contactEmail: property?.contact_email || "",
    responseTime: property?.response_time || "1 hour",
    isNew: property?.is_new || false,
    isFeatured: property?.is_featured || false,
    isVerified: property?.is_verified || false,
  })

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(property?.features || [])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities || [])
  const [customFeature, setCustomFeature] = useState("")
  const [customAmenity, setCustomAmenity] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})

  // Calculate form completion progress
  const calculateProgress = () => {
    const requiredFields = [
      formData.title,
      formData.description,
      formData.price,
      formData.location,
      formData.area,
      formData.bedrooms,
      formData.bathrooms,
      formData.size,
      formData.categoryId,
      formData.propertyType,
      formData.contactName,
      formData.contactPhone,
    ]
    const filledFields = requiredFields.filter(field => field && field.trim() !== "").length
    const hasImages = images.length > 0
    
    // Include images in progress calculation (worth 1 field)
    const totalFields = requiredFields.length + 1
    const completedFields = filledFields + (hasImages ? 1 : 0)
    
    return Math.round((completedFields / totalFields) * 100)
  }

  const addFeature = (feature: string) => {
    if (feature && !selectedFeatures.includes(feature)) {
      setSelectedFeatures([...selectedFeatures, feature])
    }
  }

  const removeFeature = (feature: string) => {
    setSelectedFeatures(selectedFeatures.filter((f) => f !== feature))
  }

  const addAmenity = (amenity: string) => {
    if (amenity && !selectedAmenities.includes(amenity)) {
      setSelectedAmenities([...selectedAmenities, amenity])
    }
  }

  const removeAmenity = (amenity: string) => {
    setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity))
  }

  const addCustomFeature = () => {
    if (customFeature.trim()) {
      addFeature(customFeature.trim())
      setCustomFeature("")
    }
  }

  const addCustomAmenity = () => {
    if (customAmenity.trim()) {
      addAmenity(customAmenity.trim())
      setCustomAmenity("")
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        formDataObj.append(key, value.toString())
      })
      
      // Add features and amenities
      selectedFeatures.forEach(feature => formDataObj.append("features", feature))
      selectedAmenities.forEach(amenity => formDataObj.append("amenities", amenity))
      
      // Add images
      images.forEach((image, index) => {
        if (image.file) {
          // New image file to upload
          formDataObj.append(`image_${index}`, image.file)
          formDataObj.append(`image_${index}_alt`, image.alt_text || "")
          formDataObj.append(`image_${index}_order`, image.order_index.toString())
          formDataObj.append(`image_${index}_is_main`, image.is_main.toString())
        } else {
          // Existing image (for updates)
          formDataObj.append(`existing_image_${index}_id`, image.id)
          formDataObj.append(`existing_image_${index}_alt`, image.alt_text || "")
          formDataObj.append(`existing_image_${index}_order`, image.order_index.toString())
          formDataObj.append(`existing_image_${index}_is_main`, image.is_main.toString())
        }
      })
      
      formDataObj.append("total_images", images.length.toString())
      
      try {
        let result
        if (mode === "create") {
          result = await createProperty({ errors: {}, message: "", success: false }, formDataObj)
        } else if (property) {
          result = await updateProperty(property.id, { errors: {}, message: "", success: false }, formDataObj)
        }

        if (result?.success) {
          toast.success(result.message)
          router.push(`/${lng}/admin/properties`)
        } else {
          if (result?.errors) {
            setErrors(result.errors)
          }
          toast.error(result?.message || "An error occurred")
        }
      } catch (error) {
        toast.error("An unexpected error occurred")
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

  const progress = calculateProgress()

  return (
    <div className="flex flex-col lg:flex-row gap-8">
      {/* Main Form */}
      <div className="flex-1 space-y-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <Label htmlFor="title">Property Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder="e.g., Modern 3BR Apartment in Downtown"
                    className={errors.title ? "border-red-500" : ""}
                  />
                  {errors.title && <p className="text-sm text-red-500 mt-1">{errors.title[0]}</p>}
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange("description", e.target.value)}
                    rows={4}
                    placeholder="Describe the property, its features, and what makes it special..."
                    className={errors.description ? "border-red-500" : ""}
                  />
                  {errors.description && <p className="text-sm text-red-500 mt-1">{errors.description[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-sm text-red-500 mt-1">{errors.categoryId[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="propertyType">Property Type *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => handleInputChange("propertyType", value)}>
                    <SelectTrigger className={errors.propertyType ? "border-red-500" : ""}>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">For Sale</SelectItem>
                      <SelectItem value="rent">For Rent</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.propertyType && <p className="text-sm text-red-500 mt-1">{errors.propertyType[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="ownerType">Owner Type</Label>
                  <Select value={formData.ownerType} onValueChange={(value) => handleInputChange("ownerType", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="owner">Owner</SelectItem>
                      <SelectItem value="broker">Broker</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Details */}
          <Card>
            <CardHeader>
              <CardTitle>Pricing & Property Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="price">Price *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="pricePerMeter">Price per m² (Optional)</Label>
                  <Input
                    id="pricePerMeter"
                    type="number"
                    value={formData.pricePerMeter}
                    onChange={(e) => handleInputChange("pricePerMeter", e.target.value)}
                    placeholder="Auto-calculated if empty"
                  />
                </div>

                <div>
                  <Label htmlFor="size">Size (m²) *</Label>
                  <Input
                    id="size"
                    type="number"
                    value={formData.size}
                    onChange={(e) => handleInputChange("size", e.target.value)}
                    placeholder="0"
                    className={errors.size ? "border-red-500" : ""}
                  />
                  {errors.size && <p className="text-sm text-red-500 mt-1">{errors.size[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="bedrooms">Bedrooms *</Label>
                  <Input
                    id="bedrooms"
                    type="number"
                    min="0"
                    value={formData.bedrooms}
                    onChange={(e) => handleInputChange("bedrooms", e.target.value)}
                    placeholder="0"
                    className={errors.bedrooms ? "border-red-500" : ""}
                  />
                  {errors.bedrooms && <p className="text-sm text-red-500 mt-1">{errors.bedrooms[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="bathrooms">Bathrooms *</Label>
                  <Input
                    id="bathrooms"
                    type="number"
                    min="0"
                    value={formData.bathrooms}
                    onChange={(e) => handleInputChange("bathrooms", e.target.value)}
                    placeholder="0"
                    className={errors.bathrooms ? "border-red-500" : ""}
                  />
                  {errors.bathrooms && <p className="text-sm text-red-500 mt-1">{errors.bathrooms[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="yearBuilt">Year Built</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>

                <div>
                  <Label htmlFor="floor">Floor</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) => handleInputChange("floor", e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <Label htmlFor="totalFloors">Total Floors</Label>
                  <Input
                    id="totalFloors"
                    type="number"
                    value={formData.totalFloors}
                    onChange={(e) => handleInputChange("totalFloors", e.target.value)}
                    placeholder="e.g., 10"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Location Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="location">Full Address *</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder="e.g., 123 Main Street, Downtown"
                    className={errors.location ? "border-red-500" : ""}
                  />
                  {errors.location && <p className="text-sm text-red-500 mt-1">{errors.location[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="area">Area/District *</Label>
                  <Input
                    id="area"
                    value={formData.area}
                    onChange={(e) => handleInputChange("area", e.target.value)}
                    placeholder="e.g., Downtown, Westside"
                    className={errors.area ? "border-red-500" : ""}
                  />
                  {errors.area && <p className="text-sm text-red-500 mt-1">{errors.area[0]}</p>}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder="e.g., John Smith"
                    className={errors.contactName ? "border-red-500" : ""}
                  />
                  {errors.contactName && <p className="text-sm text-red-500 mt-1">{errors.contactName[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="contactPhone">Phone Number *</Label>
                  <Input
                    id="contactPhone"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder="e.g., +1234567890"
                    className={errors.contactPhone ? "border-red-500" : ""}
                  />
                  {errors.contactPhone && <p className="text-sm text-red-500 mt-1">{errors.contactPhone[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="contactWhatsapp">WhatsApp (Optional)</Label>
                  <Input
                    id="contactWhatsapp"
                    value={formData.contactWhatsapp}
                    onChange={(e) => handleInputChange("contactWhatsapp", e.target.value)}
                    placeholder="e.g., +1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">Email (Optional)</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder="e.g., contact@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="responseTime">Response Time</Label>
                  <Select value={formData.responseTime} onValueChange={(value) => handleInputChange("responseTime", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15 minutes">15 minutes</SelectItem>
                      <SelectItem value="30 minutes">30 minutes</SelectItem>
                      <SelectItem value="1 hour">1 hour</SelectItem>
                      <SelectItem value="2 hours">2 hours</SelectItem>
                      <SelectItem value="1 day">1 day</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Images */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5" />
                Property Images
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Upload high-quality images to showcase your property. The first image will be used as the main image.
              </p>
            </CardHeader>
            <CardContent>
              <ImageUploadCrop
                images={images}
                onImagesChange={setImages}
                maxImages={15}
                cropAspectRatio={16/9}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>Property Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Quick Add Features</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMON_FEATURES.map((feature) => (
                    <Button
                      key={feature}
                      type="button"
                      variant={selectedFeatures.includes(feature) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        selectedFeatures.includes(feature) ? removeFeature(feature) : addFeature(feature)
                      }
                    >
                      {feature}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom feature"
                  value={customFeature}
                  onChange={(e) => setCustomFeature(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomFeature())}
                />
                <Button type="button" onClick={addCustomFeature}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedFeatures.length > 0 && (
                <div>
                  <Label>Selected Features</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedFeatures.map((feature) => (
                      <Badge key={feature} variant="secondary" className="flex items-center gap-1">
                        {feature}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeFeature(feature)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Amenities */}
          <Card>
            <CardHeader>
              <CardTitle>Building Amenities</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>Quick Add Amenities</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {COMMON_AMENITIES.map((amenity) => (
                    <Button
                      key={amenity}
                      type="button"
                      variant={selectedAmenities.includes(amenity) ? "default" : "outline"}
                      size="sm"
                      onClick={() =>
                        selectedAmenities.includes(amenity) ? removeAmenity(amenity) : addAmenity(amenity)
                      }
                    >
                      {amenity}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Add custom amenity"
                  value={customAmenity}
                  onChange={(e) => setCustomAmenity(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), addCustomAmenity())}
                />
                <Button type="button" onClick={addCustomAmenity}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {selectedAmenities.length > 0 && (
                <div>
                  <Label>Selected Amenities</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedAmenities.map((amenity) => (
                      <Badge key={amenity} variant="secondary" className="flex items-center gap-1">
                        {amenity}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 hover:bg-transparent"
                          onClick={() => removeAmenity(amenity)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Property Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFeatured">Featured Property</Label>
                  <p className="text-sm text-muted-foreground">Display this property prominently on the homepage</p>
                </div>
                <Switch
                  id="isFeatured"
                  checked={formData.isFeatured}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isFeatured: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isNew">New Property</Label>
                  <p className="text-sm text-muted-foreground">Mark this property as newly listed</p>
                </div>
                <Switch
                  id="isNew"
                  checked={formData.isNew}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isNew: checked }))}
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isVerified">Verified Property</Label>
                  <p className="text-sm text-muted-foreground">Mark this property as verified by admin</p>
                </div>
                <Switch
                  id="isVerified"
                  checked={formData.isVerified}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isVerified: checked }))}
                />
              </div>
            </CardContent>
          </Card>
        </form>
      </div>

      {/* Sticky Sidebar */}
      <div className="w-80 space-y-6">
        {/* Actions Card */}
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? "Creating..." : "Updating..."}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === "create" ? "Create Property" : "Update Property"}
                </>
              )}
            </Button>

            <Link href={`/${lng}/admin/properties`}>
              <Button type="button" variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Properties
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>Form Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Completion</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">Fill in required fields to complete the listing</p>
            </div>
          </CardContent>
        </Card>

        {/* Tips Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="w-4 h-4" />
              Quick Tips
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-2">
              <p>• Use high-quality images for better engagement</p>
              <p>• Write detailed descriptions highlighting unique features</p>
              <p>• Set competitive pricing based on market research</p>
              <p>• Include accurate contact information</p>
              <p>• Add location coordinates for map display</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 