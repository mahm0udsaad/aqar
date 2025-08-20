"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { Save, X, MapPin, Phone, Plus, Info, Loader2, ArrowLeft, Camera, VideoIcon } from "lucide-react"
import Link from "next/link"
import { createProperty, updateProperty } from "@/lib/actions/properties"
import { createArea, getAreas } from "@/lib/actions/areas"
import { toast } from "sonner"
import type { Database } from "@/lib/supabase/types"
import { ImageUploadCrop, PropertyImage } from "@/components/admin/image-upload-crop"
import { VideoUploader, VideoFile } from "@/components/admin/video-uploader"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

function extractSrcFromIframe(iframe: string): string | null {
  if (!iframe || iframe.trim() === '') return null;
  const srcMatch = iframe.match(/src="([^"]+)"/);
  if (srcMatch) return srcMatch[1];
  const srcMatchSingle = iframe.match(/src='([^']+)'/);
  if (srcMatchSingle) return srcMatchSingle[1];
  if (iframe.includes('maps.google.com') || iframe.includes('google.com/maps')) {
    return iframe.trim();
  }
  return null;
}

type Property = Database["public"]["Tables"]["properties"]["Row"]
type PropertyImageDB = Database["public"]["Tables"]["property_images"]["Row"]
type PropertyVideoDB = Database["public"]["Tables"]["property_videos"]["Row"]

interface Category {
  id: string
  name: string
}

interface Area {
  id: string
  name: string
  slug: string
  description: string | null
  order_index: number | null
  is_active: boolean | null
}

interface PropertyFormProps {
  categories: Category[]
  areas: Area[]
  lng: string
  mode: "create" | "edit"
  property?: Property & { property_images?: PropertyImageDB[], property_videos?: PropertyVideoDB[] }
  dict: any
  dictEn?: any
  dictAr?: any
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

export function PropertyForm({ categories, areas, lng, mode, property, dict, dictEn, dictAr }: PropertyFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  
  const [formLang, setFormLang] = useState<'en' | 'ar'>(lng === 'ar' ? 'ar' : 'en')
  const activeDict = formLang === 'ar' ? (dictAr || dict) : (dictEn || dict)
  
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

  const initializeVideos = (): VideoFile[] => {
    if (!property?.property_videos) return []
    
    return property.property_videos.map((vid) => ({
      id: vid.id,
      url: vid.url,
      caption: vid.caption || "",
      order: vid.order_index || 0,
    }))
  }

  // Form state - English and Arabic content separated
  const [images, setImages] = useState<PropertyImage[]>(initializeImages())
  const [videos, setVideos] = useState<VideoFile[]>(initializeVideos())
  const [formData, setFormData] = useState({
    // English content
    title: property?.title || "",
    description: property?.description || "",
    location: property?.location || "",
    // Arabic content
    title_en: (property as any)?.title_en || "",
    title_ar: (property as any)?.title_ar || "",
    description_en: (property as any)?.description_en || "",
    description_ar: (property as any)?.description_ar || "",
    location_en: (property as any)?.location_en || "",
    location_ar: (property as any)?.location_ar || "",
    // Other fields
    price: property?.price?.toString() || "",
    pricePerMeter: property?.price_per_meter?.toString() || "",
    area: property?.area || "",
    areaId: property?.area_id || "",
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
    locationIframeUrl: property?.location_iframe_url || "",
  })

  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(property?.features || [])
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>(property?.amenities || [])
  const [customFeature, setCustomFeature] = useState("")
  const [customAmenity, setCustomAmenity] = useState("")
  const [errors, setErrors] = useState<Record<string, string[]>>({})
  
  // Currency handling (store values in EGP; allow admin to input other currencies)
  const CURRENCY_RATES: Record<string, number> = {
    EGP: 1,
    USD: 50,
    EUR: 55,
    GBP: 64,
    SAR: 13.3,
    AED: 13.6,
  }
  const [currency, setCurrency] = useState<keyof typeof CURRENCY_RATES>("EGP")
  const [exchangeRate, setExchangeRate] = useState<number>(CURRENCY_RATES["EGP"]) // to EGP
  
  // Area management state
  const [availableAreas, setAvailableAreas] = useState<Area[]>(areas)
  const [showNewAreaInput, setShowNewAreaInput] = useState(false)
  const [newAreaName, setNewAreaName] = useState("")
  const [isCreatingArea, setIsCreatingArea] = useState(false)

  // Calculate form completion progress
  const calculateProgress = () => {
    const requiredFields = [
      formData.title,
      formData.description,
      formData.price,
      formData.location,
      formData.areaId,
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
    const hasVideos = videos.length > 0
    
    // Include images and videos in progress calculation
    const totalFields = requiredFields.length + 2
    const completedFields = filledFields + (hasImages ? 1 : 0) + (hasVideos ? 1 : 0)
    
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

  // Area management functions
  const handleCreateArea = async () => {
    if (!newAreaName.trim()) {
      toast.error("Please enter an area name")
      return
    }
    
    setIsCreatingArea(true)
    console.log("Creating area:", newAreaName.trim())
    
    try {
      const formData = new FormData()
      formData.append("name", newAreaName.trim())
      formData.append("isActive", "true")
      formData.append("description", "")
      formData.append("orderIndex", "0")
      
      console.log("FormData entries:", Object.fromEntries(formData.entries()))
      
      const result = await createArea({ errors: {}, message: "", success: false }, formData)
      
      console.log("Create area result:", result)
      
      if (result.success) {
        toast.success(result.message || "Area created successfully!")
        
        // Refresh areas list
        try {
          const updatedAreas = await getAreas()
          console.log("Updated areas:", updatedAreas)
          setAvailableAreas(updatedAreas)
          
          // Find the newly created area and select it
          const newArea = updatedAreas.find(area => area.name === newAreaName.trim())
          if (newArea) {
            setFormData(prev => ({ ...prev, areaId: newArea.id, area: newArea.name }))
            console.log("Selected new area:", newArea)
          }
        } catch (fetchError) {
          console.error("Error fetching updated areas:", fetchError)
        }
        
        // Reset form
        setNewAreaName("")
        setShowNewAreaInput(false)
        
        // Optional: Trigger a page refresh if needed
        // window.location.reload()
      } else {
        console.error("Failed to create area:", result)
        if (result.errors) {
          const errorMessages = Object.values(result.errors).flat()
          toast.error(`Validation errors: ${errorMessages.join(", ")}`)
        } else {
          toast.error(result.message || "Failed to create area")
        }
      }
    } catch (error) {
      console.error("Error creating area:", error)
      toast.error(`Failed to create area: ${error}`)
    } finally {
      setIsCreatingArea(false)
    }
  }

  const handleAreaChange = (areaId: string) => {
    if (areaId === "add_new") {
      setShowNewAreaInput(true)
      return
    }
    
    const selectedArea = availableAreas.find(area => area.id === areaId)
    setFormData(prev => ({ 
      ...prev, 
      areaId: areaId,
      area: selectedArea ? selectedArea.name : ""
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    startTransition(async () => {
      const formDataObj = new FormData()
      
      // Add all form fields except special-cased ones
      Object.entries(formData).forEach(([key, value]) => {
        if (key === 'locationIframeUrl') return
        if (key === 'price' || key === 'pricePerMeter') return
        formDataObj.append(key, value.toString())
      })

      // Convert price and pricePerMeter to EGP before submit
      const numericPrice = parseFloat(formData.price || "0")
      const priceInEgp = Number.isFinite(numericPrice)
        ? (currency === "EGP" ? numericPrice : numericPrice * (exchangeRate || 1))
        : 0
      formDataObj.append("price", priceInEgp.toString())

      if (formData.pricePerMeter && formData.pricePerMeter.trim() !== "") {
        const numericPpm = parseFloat(formData.pricePerMeter)
        const ppmInEgp = Number.isFinite(numericPpm)
          ? (currency === "EGP" ? numericPpm : numericPpm * (exchangeRate || 1))
          : undefined
        if (ppmInEgp !== undefined) {
          formDataObj.append("pricePerMeter", ppmInEgp.toString())
        }
      }

      const iframeSrc = extractSrcFromIframe(formData.locationIframeUrl);
      if (iframeSrc) {
        formDataObj.append("locationIframeUrl", iframeSrc);
      }
      
      // Add area_id if selected
      if (formData.areaId) {
        formDataObj.append("areaId", formData.areaId)
      }
      
      // Add features and amenities
      selectedFeatures.forEach(feature => formDataObj.append("features", feature))
      selectedAmenities.forEach(amenity => formDataObj.append("amenities", amenity))
      
      // Add images
      images.forEach((image, index) => {
        const fileToUpload = image.file ?? image.originalFile
        if (fileToUpload) {
          // New image file to upload (supports original or cropped file)
          formDataObj.append(`image_${index}`, fileToUpload)
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

      // Add videos (support file uploads and URLs)
      videos.forEach((video, index) => {
        if (video.file) {
          formDataObj.append(`video_file_${index}`, video.file)
        }
        formDataObj.append(`video_${index}_url`, video.url)
        formDataObj.append(`video_${index}_caption`, video.caption || "")
        formDataObj.append(`video_${index}_order`, video.order.toString())
        if (video.id) {
          formDataObj.append(`video_${index}_id`, video.id)
        }
      });
      formDataObj.append("total_videos", videos.length.toString());
      
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
        <form onSubmit={handleSubmit} className={"space-y-8 " + (formLang === 'ar' ? "[&_label]:text-right [&_label]:block" : "") }>
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>{activeDict.admin.properties.form.basicInfoTitle}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {activeDict.admin.properties.form.basicInfoSubtitle}
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <Tabs value={formLang} onValueChange={(v) => setFormLang(v as 'en' | 'ar')}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="en">{activeDict.admin.properties.form.englishTab}</TabsTrigger>
                  <TabsTrigger value="ar">{activeDict.admin.properties.form.arabicTab}</TabsTrigger>
                </TabsList>
                
                <TabsContent value="en" className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div>
                      <Label htmlFor="title_en">{activeDict.admin.properties.form.titleEnLabel}</Label>
                      <Input
                        id="title_en"
                        dir="ltr"
                        value={formData.title_en}
                        onChange={(e) => handleInputChange("title_en", e.target.value)}
                        placeholder={activeDict.admin.properties.form.titleEnPlaceholder}
                        className={errors.title_en ? "border-red-500" : ""}
                      />
                      {errors.title_en && <p className="text-sm text-red-500 mt-1">{errors.title_en[0]}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="description_en">{activeDict.admin.properties.form.descriptionEnLabel}</Label>
                      <Textarea
                        id="description_en"
                        dir="ltr"
                        value={formData.description_en}
                        onChange={(e) => handleInputChange("description_en", e.target.value)}
                        rows={4}
                        placeholder={activeDict.admin.properties.form.descriptionEnPlaceholder}
                        className={errors.description_en ? "border-red-500" : ""}
                      />
                      {errors.description_en && <p className="text-sm text-red-500 mt-1">{errors.description_en[0]}</p>}
                    </div>
                    
                    <div>
                      <Label htmlFor="location_en">{activeDict.admin.properties.form.addressEnLabel}</Label>
                      <Input
                        id="location_en"
                        dir="ltr"
                        value={formData.location_en}
                        onChange={(e) => handleInputChange("location_en", e.target.value)}
                        placeholder={activeDict.admin.properties.form.addressEnPlaceholder}
                        className={errors.location_en ? "border-red-500" : ""}
                      />
                      {errors.location_en && <p className="text-sm text-red-500 mt-1">{errors.location_en[0]}</p>}
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="ar" className="space-y-6">
                  <div className="grid grid-cols-1 gap-6">
                    <div className="text-right">
                      <Label htmlFor="title_ar">العنوان (العربية) *</Label>
                      <Input
                        id="title_ar"
                        dir="rtl"
                        value={formData.title_ar}
                        onChange={(e) => handleInputChange("title_ar", e.target.value)}
                        placeholder="مثال: شقة ٣ غرف حديثة في وسط المدينة"
                        className={errors.title_ar ? "border-red-500" : ""}
                      />
                      {errors.title_ar && <p className="text-sm text-red-500 mt-1">{errors.title_ar[0]}</p>}
                    </div>
                    
                    <div className="text-right">
                      <Label htmlFor="description_ar">الوصف (العربية) *</Label>
                      <Textarea
                        id="description_ar"
                        dir="rtl"
                        value={formData.description_ar}
                        onChange={(e) => handleInputChange("description_ar", e.target.value)}
                        rows={4}
                        placeholder="صف العقار ومميزاته وما يجعله خاصًا..."
                        className={errors.description_ar ? "border-red-500" : ""}
                      />
                      {errors.description_ar && <p className="text-sm text-red-500 mt-1">{errors.description_ar[0]}</p>}
                    </div>
                    
                    <div className="text-right">
                      <Label htmlFor="location_ar">العنوان (العربية) *</Label>
                      <Input
                        id="location_ar"
                        dir="rtl"
                        value={formData.location_ar}
                        onChange={(e) => handleInputChange("location_ar", e.target.value)}
                        placeholder="مثال: ١٢٣ شارع رئيسي، وسط المدينة"
                        className={errors.location_ar ? "border-red-500" : ""}
                      />
                      {errors.location_ar && <p className="text-sm text-red-500 mt-1">{errors.location_ar[0]}</p>}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              {/* Legacy fields for backward compatibility */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t">
                <div className="md:col-span-2">
                  <Label htmlFor="title">{activeDict.admin.properties.form.legacyTitleLabel}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange("title", e.target.value)}
                    placeholder={activeDict.admin.properties.form.legacyTitlePlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="categoryId">{activeDict.admin.properties.form.categoryLabel} *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange("categoryId", value)}>
                    <SelectTrigger className={errors.categoryId ? "border-red-500" : ""}>
                      <SelectValue placeholder={activeDict.admin.properties.form.selectCategory} />
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
                  <Label htmlFor="propertyType">{activeDict.admin.properties.form.typeLabel} *</Label>
                  <Select value={formData.propertyType} onValueChange={(value) => handleInputChange("propertyType", value)}>
                    <SelectTrigger className={errors.propertyType ? "border-red-500" : ""}>
                      <SelectValue placeholder={activeDict.admin.properties.form.selectType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sale">{activeDict.admin.properties.form.forSale}</SelectItem>
                      <SelectItem value="rent">{activeDict.admin.properties.form.forRent}</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.propertyType && <p className="text-sm text-red-500 mt-1">{errors.propertyType[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="ownerType">{activeDict.admin.properties.form.ownerTypeLabel}</Label>
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
                  <Label htmlFor="status">{activeDict.admin.properties.form.statusLabel}</Label>
                  <Select value={formData.status} onValueChange={(value) => handleInputChange("status", value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">{activeDict.admin.properties.active}</SelectItem>
                      <SelectItem value="draft">{activeDict.admin.properties.search.draft}</SelectItem>
                      <SelectItem value="inactive">{activeDict.admin.properties.inactive}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing & Details */}
          <Card>
            <CardHeader>
              <CardTitle>{activeDict.admin.properties.form.pricingDetailsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="price">{activeDict.admin.properties.form.priceLabel.replace("(EGP)", "")} *</Label>
                  <Input
                    id="price"
                    type="number"
                    value={formData.price}
                    onChange={(e) => handleInputChange("price", e.target.value)}
                    placeholder="0"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && <p className="text-sm text-red-500 mt-1">{errors.price[0]}</p>}
                  <p className="text-xs text-muted-foreground mt-1">
                    {formLang === 'ar' ? 'يتم التخزين بالجنيه المصري. العملة الحالية: ' : 'Stored in EGP. Current currency: '} 
                    {currency}
                    {currency !== "EGP" ? (formLang === 'ar' ? ` → ${(parseFloat(formData.price || "0") * (exchangeRate || 1) || 0).toLocaleString()} ج.م` : ` → ${(parseFloat(formData.price || "0") * (exchangeRate || 1) || 0).toLocaleString()} EGP`) : ""}
                  </p>
                </div>

                <div>
                  <Label htmlFor="pricePerMeter">{activeDict.admin.properties.form.pricePerMeterLabel}</Label>
                  <Input
                    id="pricePerMeter"
                    type="number"
                    value={formData.pricePerMeter}
                    onChange={(e) => handleInputChange("pricePerMeter", e.target.value)}
                    placeholder="Auto-calculated if empty"
                  />
                  {formData.pricePerMeter && currency !== "EGP" && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {formLang === 'ar' ? '≈ ' : '≈ '} {(parseFloat(formData.pricePerMeter || "0") * (exchangeRate || 1) || 0).toLocaleString()} {formLang === 'ar' ? 'ج.م' : 'EGP'}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor="size">{activeDict.admin.properties.form.sizeLabel} *</Label>
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
                  <Label htmlFor="currency">{activeDict.admin.properties.form.currencyLabel}</Label>
                  <Select value={currency} onValueChange={(val) => {
                    const next = (val as keyof typeof CURRENCY_RATES)
                    setCurrency(next)
                    setExchangeRate(CURRENCY_RATES[next] ?? 1)
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(CURRENCY_RATES).map((code) => (
                        <SelectItem key={code} value={code}>{code}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="bedrooms">{activeDict.admin.properties.form.bedroomsLabel} *</Label>
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
                  <Label htmlFor="bathrooms">{activeDict.admin.properties.form.bathroomsLabel} *</Label>
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
                  <Label htmlFor="yearBuilt">{activeDict.admin.properties.form.yearBuiltLabel}</Label>
                  <Input
                    id="yearBuilt"
                    type="number"
                    value={formData.yearBuilt}
                    onChange={(e) => handleInputChange("yearBuilt", e.target.value)}
                    placeholder="e.g., 2020"
                  />
                </div>

                <div>
                  <Label htmlFor="floor">{activeDict.admin.properties.form.floorLabel}</Label>
                  <Input
                    id="floor"
                    type="number"
                    value={formData.floor}
                    onChange={(e) => handleInputChange("floor", e.target.value)}
                    placeholder="e.g., 5"
                  />
                </div>

                <div>
                  <Label htmlFor="totalFloors">{activeDict.admin.properties.form.totalFloorsLabel}</Label>
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
                {activeDict.admin.properties.form.locationInfoTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="location">{activeDict.admin.properties.form.legacyLocationLabel}</Label>
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => handleInputChange("location", e.target.value)}
                    placeholder={activeDict.admin.properties.form.legacyLocationPlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="areaId">{activeDict.admin.properties.form.areaDistrictLabel}</Label>
                  {!showNewAreaInput ? (
                    <div className="space-y-2">
                      <Select value={formData.areaId} onValueChange={handleAreaChange}>
                        <SelectTrigger className={errors.areaId ? "border-red-500" : ""}>
                          <SelectValue placeholder={activeDict.admin.properties.form.selectArea} />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAreas.map((area) => (
                            <SelectItem key={area.id} value={area.id}>
                              {area.name}
                            </SelectItem>
                          ))}
                          <SelectItem value="add_new" className="text-blue-600 font-medium">
                            <Plus className="w-4 h-4 mr-2 inline" />
                            {activeDict.admin.properties.form.addNewArea}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      {errors.areaId && <p className="text-sm text-red-500 mt-1">{errors.areaId[0]}</p>}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder={activeDict.admin.properties.form.newAreaNamePlaceholder}
                          value={newAreaName}
                          onChange={(e) => setNewAreaName(e.target.value)}
                          onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleCreateArea())}
                          disabled={isCreatingArea}
                        />
                        <Button 
                          type="button" 
                          onClick={handleCreateArea}
                          disabled={!newAreaName.trim() || isCreatingArea}
                          size="sm"
                        >
                          {isCreatingArea ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Plus className="w-4 h-4" />
                          )}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setShowNewAreaInput(false)
                            setNewAreaName("")
                          }}
                          size="sm"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{activeDict.admin.properties.form.newAreaHelp}</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="locationIframeUrl">{activeDict.admin.properties.form.googleMapsIframeLabel}</Label>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button type="button" variant="outline" size="sm">
                        <Info className="w-4 h-4 mr-2" />
                       {activeDict.admin.howToGetIframe}
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>{activeDict.admin.howToGetIframeTitle}</DialogTitle>
                      </DialogHeader>
                      <div className="aspect-video w-full">
                        <video src="https://hvlbyykohjeavnaqgiix.supabase.co/storage/v1/object/public/property-videos/videos/properties/how-to-get-iframe.mp4" controls className="w-full h-full rounded-md" />
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <Textarea
                  id="locationIframeUrl"
                  dir="ltr"
                  value={formData.locationIframeUrl}
                  onChange={(e) => handleInputChange("locationIframeUrl", e.target.value)}
                  placeholder={activeDict.admin.properties.form.googleMapsIframePlaceholder}
                  className={errors.locationIframeUrl ? "border-red-500 text-left" : "text-left"}
                  rows={5}
                />
                {errors.locationIframeUrl && <p className="text-sm text-red-500 mt-1">{errors.locationIframeUrl[0]}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="w-5 h-5" />
                {activeDict.admin.properties.form.contactInfoTitle}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="contactName">{activeDict.admin.properties.form.contactNameLabel}</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => handleInputChange("contactName", e.target.value)}
                    placeholder={activeDict.admin.properties.form.contactNamePlaceholder}
                    className={errors.contactName ? "border-red-500" : ""}
                  />
                  {errors.contactName && <p className="text-sm text-red-500 mt-1">{errors.contactName[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="contactPhone">{activeDict.admin.properties.form.phoneNumberLabel}</Label>
                  <Input
                    id="contactPhone"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange("contactPhone", e.target.value)}
                    placeholder={activeDict.admin.properties.form.phoneNumberPlaceholder}
                    className={errors.contactPhone ? "border-red-500" : ""}
                  />
                  {errors.contactPhone && <p className="text-sm text-red-500 mt-1">{errors.contactPhone[0]}</p>}
                </div>

                <div>
                  <Label htmlFor="contactWhatsapp">{activeDict.admin.properties.form.whatsappLabel}</Label>
                  <Input
                    id="contactWhatsapp"
                    type="tel"
                    inputMode="tel"
                    dir="ltr"
                    value={formData.contactWhatsapp}
                    onChange={(e) => handleInputChange("contactWhatsapp", e.target.value)}
                    placeholder={activeDict.admin.properties.form.whatsappPlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="contactEmail">{activeDict.admin.properties.form.emailLabel}</Label>
                  <Input
                    id="contactEmail"
                    type="email"
                    dir="ltr"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange("contactEmail", e.target.value)}
                    placeholder={activeDict.admin.properties.form.emailPlaceholder}
                  />
                </div>

                <div>
                  <Label htmlFor="responseTime">{activeDict.admin.properties.form.responseTimeLabel}</Label>
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
                {activeDict.admin.properties.form.imagesTitle}
              </CardTitle>
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Upload high-quality images to showcase your property. The first image will be used as the main image.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <h4 className="text-sm font-medium text-blue-900 mb-2">📷 Image Guidelines:</h4>
                  <ul className="text-xs text-blue-800 space-y-1">
                    <li>• <strong>Recommended size:</strong> 1200×800 pixels (16:9 ratio)</li>
                    <li>• <strong>Maximum file size:</strong> 5MB per image</li>
                    <li>• <strong>Supported formats:</strong> JPG, PNG, WebP</li>
                    <li>• <strong>Best practices:</strong> High-quality, well-lit, multiple angles</li>
                    <li>• <strong>Main image:</strong> Choose the most attractive view as main</li>
                  </ul>
                </div>
              </div>
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

          {/* Videos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5" />
                {activeDict.admin.properties.form.videosTitle}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader
                initialVideos={videos}
                onVideosChange={setVideos}
                maxFiles={5}
              />
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle>{activeDict.admin.properties.form.featuresTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{activeDict.admin.properties.form.quickAddFeatures}</Label>
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
                  placeholder={activeDict.admin.properties.form.addCustomFeaturePlaceholder}
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
                  <Label>{activeDict.admin.properties.form.selectedFeatures}</Label>
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
              <CardTitle>{activeDict.admin.properties.form.amenitiesTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label>{activeDict.admin.properties.form.quickAddAmenities}</Label>
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
                  placeholder={activeDict.admin.properties.form.addCustomAmenityPlaceholder}
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
                  <Label>{activeDict.admin.properties.form.selectedAmenities}</Label>
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
              <CardTitle>{activeDict.admin.properties.form.settingsTitle}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="isFeatured">{activeDict.admin.properties.form.featuredPropertyLabel}</Label>
                  <p className="text-sm text-muted-foreground">{activeDict.admin.properties.form.featuredPropertyDesc}</p>
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
                  <Label htmlFor="isNew">{activeDict.admin.properties.form.newPropertyLabel}</Label>
                  <p className="text-sm text-muted-foreground">{activeDict.admin.properties.form.newPropertyDesc}</p>
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
                  <Label htmlFor="isVerified">{activeDict.admin.properties.form.verifiedPropertyLabel}</Label>
                  <p className="text-sm text-muted-foreground">{activeDict.admin.properties.form.verifiedPropertyDesc}</p>
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
        <Card className="sticky top-16">
          <CardHeader>
            <CardTitle>{activeDict.admin.properties.form.actionsTitle}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={handleSubmit} className="w-full" disabled={isPending}>
              {isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {mode === "create" ? activeDict.admin.properties.form.creating : activeDict.admin.properties.form.updating}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {mode === "create" ? activeDict.admin.properties.form.createButton : activeDict.admin.properties.form.updateButton}
                </>
              )}
            </Button>

            <Link href={`/${lng}/admin/properties`}>
              <Button type="button" variant="outline" className="w-full">
                <ArrowLeft className="w-4 h-4 mr-2" />
                {activeDict.admin.properties.form.backToProperties}
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Progress Card */}
        <Card>
          <CardHeader>
            <CardTitle>{activeDict.admin.properties.form.progressTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>{activeDict.admin.properties.form.completionLabel}</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
              <p className="text-xs text-muted-foreground">{activeDict.admin.properties.form.completionHelp}</p>
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
              <p>• Fill both English and Arabic content for better reach</p>
              <p>• Use high-quality images for better engagement</p>
              <p>• Write detailed descriptions highlighting unique features</p>
              <p>• Set competitive pricing based on market research</p>
              <p>• Include accurate contact information</p>
              <p>• Add location coordinates for map display</p>
            </div>
          </CardContent>
        </Card>

        {/* Language Status */}
        <Card>
          <CardHeader>
            <CardTitle>{activeDict.admin.properties.form.contentStatusTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">{activeDict.admin.properties.form.englishContentLabel}</span>
              <Badge variant={formData.title_en && formData.description_en && formData.location_en ? "default" : "secondary"}>
                {formData.title_en && formData.description_en && formData.location_en ? activeDict.admin.properties.form.completeLabel : activeDict.admin.properties.form.incompleteLabel}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">{activeDict.admin.properties.form.arabicContentLabel}</span>
              <Badge variant={formData.title_ar && formData.description_ar && formData.location_ar ? "default" : "secondary"}>
                {formData.title_ar && formData.description_ar && formData.location_ar ? activeDict.admin.properties.form.completeLabel : activeDict.admin.properties.form.incompleteLabel}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}