"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import { useDropzone } from "react-dropzone"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { 
  Upload, 
  X, 
  Edit, 
  Star, 
  StarOff, 
  Move, 
  Crop as CropIcon,
  Save,
  Loader2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FlipHorizontal,
  FlipVertical,
  Settings,
  Image as ImageIcon,
  Eye,
  Download,
  Maximize2
} from "lucide-react"
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export interface PropertyImage {
  id: string
  url: string
  alt_text: string | null
  order_index: number
  is_main: boolean
  file?: File
  originalFile?: File
}

interface ImageUploadCropProps {
  images: PropertyImage[]
  onImagesChange: (images: PropertyImage[]) => void
  maxImages?: number
  cropAspectRatio?: number
}

interface CropData {
  x: number
  y: number
  width: number
  height: number
}

// Helper function to create image from canvas
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })
}

// Helper function to crop image
async function getCroppedImg(
  imageSrc: string,
  pixelCrop: CropData,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
): Promise<{ file: File; url: string }> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!

  const maxSize = Math.max(image.width, image.height)
  const safeArea = 2 * ((maxSize / 2) * Math.sqrt(2))

  canvas.width = safeArea
  canvas.height = safeArea

  ctx.translate(safeArea / 2, safeArea / 2)
  ctx.rotate((rotation * Math.PI) / 180)
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1)
  ctx.translate(-safeArea / 2, -safeArea / 2)

  ctx.drawImage(
    image,
    safeArea / 2 - image.width * 0.5,
    safeArea / 2 - image.height * 0.5
  )

  const data = ctx.getImageData(0, 0, safeArea, safeArea)

  canvas.width = pixelCrop.width
  canvas.height = pixelCrop.height

  ctx.putImageData(
    data,
    Math.round(0 - safeArea / 2 + image.width * 0.5 - pixelCrop.x),
    Math.round(0 - safeArea / 2 + image.height * 0.5 - pixelCrop.y)
  )

  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], 'cropped-image.jpg', { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        resolve({ file, url })
      }
    }, 'image/jpeg', 0.9)
  })
}

// Advanced Image Editor Component
function ImageEditor({ 
  image, 
  isOpen, 
  onClose, 
  onSave 
}: {
  image: PropertyImage | null
  isOpen: boolean
  onClose: () => void
  onSave: (croppedImage: { file: File; url: string }, altText: string) => void
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [flip, setFlip] = useState({ horizontal: false, vertical: false })
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropData | null>(null)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [altText, setAltText] = useState("")
  const [isProcessing, setIsProcessing] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  useEffect(() => {
    if (image) {
      setAltText(image.alt_text || "")
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      setFlip({ horizontal: false, vertical: false })
    }
  }, [image])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropData) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!image || !croppedAreaPixels) return

    setIsProcessing(true)
    try {
      const croppedImage = await getCroppedImg(
        image.url,
        croppedAreaPixels,
        rotation,
        flip
      )
      
      onSave(croppedImage, altText)
      onClose()
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process image')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetTransforms = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setFlip({ horizontal: false, vertical: false })
  }

  if (!image) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CropIcon className="w-5 h-5" />
              Advanced Image Editor
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="w-4 h-4 mr-2" />
              {showAdvanced ? 'Simple' : 'Advanced'}
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(90vh-120px)]">
          {/* Crop Area */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden">
            <Cropper
              image={image.url}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              rotation={rotation}
              onCropChange={setCrop}
              onCropComplete={onCropComplete}
              onZoomChange={setZoom}
              style={{
                containerStyle: {
                  width: '100%',
                  height: '100%',
                  background: '#000',
                },
                cropAreaStyle: {
                  border: '2px solid #3b82f6',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.5)',
                },
                mediaStyle: {
                  transform: `scaleX(${flip.horizontal ? -1 : 1}) scaleY(${flip.vertical ? -1 : 1})`,
                }
              }}
            />
            
            {/* Overlay Controls */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <ZoomIn className="w-4 h-4" />
                  {Math.round(zoom * 100)}%
                </div>
              </div>
              
              <div className="bg-black/70 backdrop-blur-sm rounded-lg p-2">
                <div className="flex items-center gap-2 text-white text-sm">
                  <RotateCw className="w-4 h-4" />
                  {rotation}°
                </div>
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="w-full lg:w-80 space-y-6 overflow-y-auto">
            {/* Aspect Ratio */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-medium">Aspect Ratio</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={aspectRatio === 16/9 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatio(16/9)}
                  >
                    16:9
                  </Button>
                  <Button
                    variant={aspectRatio === 4/3 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatio(4/3)}
                  >
                    4:3
                  </Button>
                  <Button
                    variant={aspectRatio === 1 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatio(1)}
                  >
                    1:1
                  </Button>
                  <Button
                    variant={aspectRatio === 3/4 ? "default" : "outline"}
                    size="sm"
                    onClick={() => setAspectRatio(3/4)}
                  >
                    3:4
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Zoom Control */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-medium flex items-center gap-2">
                  <ZoomIn className="w-4 h-4" />
                  Zoom: {Math.round(zoom * 100)}%
                </Label>
                <Slider
                  value={[zoom]}
                  onValueChange={(value) => setZoom(value[0])}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.max(1, zoom - 0.1))}
                  >
                    <ZoomOut className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setZoom(Math.min(3, zoom + 0.1))}
                  >
                    <ZoomIn className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {showAdvanced && (
              <>
                {/* Rotation Control */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <Label className="font-medium flex items-center gap-2">
                      <RotateCw className="w-4 h-4" />
                      Rotation: {rotation}°
                    </Label>
                    <Slider
                      value={[rotation]}
                      onValueChange={(value) => setRotation(value[0])}
                      min={-180}
                      max={180}
                      step={1}
                      className="w-full"
                    />
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotation(rotation - 90)}
                      >
                        -90°
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setRotation(rotation + 90)}
                      >
                        +90°
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Flip Controls */}
                <Card>
                  <CardContent className="p-4 space-y-4">
                    <Label className="font-medium">Flip</Label>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlipHorizontal className="w-4 h-4" />
                          <span className="text-sm">Horizontal</span>
                        </div>
                        <Switch
                          checked={flip.horizontal}
                          onCheckedChange={(checked) => 
                            setFlip(prev => ({ ...prev, horizontal: checked }))
                          }
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FlipVertical className="w-4 h-4" />
                          <span className="text-sm">Vertical</span>
                        </div>
                        <Switch
                          checked={flip.vertical}
                          onCheckedChange={(checked) => 
                            setFlip(prev => ({ ...prev, vertical: checked }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Alt Text */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label htmlFor="altText" className="font-medium">Image Description</Label>
                <Textarea
                  id="altText"
                  value={altText}
                  onChange={(e) => setAltText(e.target.value)}
                  placeholder="Describe this image for accessibility..."
                  rows={3}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={resetTransforms}
                variant="outline"
                className="w-full"
              >
                Reset All
              </Button>
              
              <div className="flex gap-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                  disabled={isProcessing}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="flex-1"
                  disabled={!croppedAreaPixels || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Save Image
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Enhanced Sortable Image Item Component
function SortableImageItem({ 
  image, 
  onEdit, 
  onDelete, 
  onSetMain, 
  onUpdateAltText 
}: {
  image: PropertyImage
  onEdit: () => void
  onDelete: () => void
  onSetMain: () => void
  onUpdateAltText: (altText: string) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const [altText, setAltText] = useState(image.alt_text || "")
  const [isEditingAlt, setIsEditingAlt] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  const handleAltTextSave = () => {
    onUpdateAltText(altText)
    setIsEditingAlt(false)
  }

  return (
    <Card ref={setNodeRef} style={style} className="relative group hover:shadow-lg transition-all duration-200">
      <CardContent className="p-0">
        <div className="relative overflow-hidden rounded-t-lg">
          {!imageLoaded && (
            <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
              <ImageIcon className="w-8 h-8 text-gray-400" />
            </div>
          )}
          <img
            src={image.url}
            alt={image.alt_text || `Property image ${image.order_index + 1}`}
            className="w-full h-48 object-cover transition-transform group-hover:scale-105"
            onLoad={() => setImageLoaded(true)}
          />
          
          {/* Main image badge */}
          {image.is_main && (
            <Badge className="absolute top-3 left-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white shadow-lg">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Main Image
            </Badge>
          )}

          {/* Image index */}
          <Badge variant="secondary" className="absolute top-3 right-3 bg-black/70 text-white">
            #{image.order_index + 1}
          </Badge>

          {/* Action buttons overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-200">
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={onEdit}
              >
                <Edit className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="secondary"
                className="h-8 w-8 p-0 bg-white/90 hover:bg-white"
                onClick={() => window.open(image.url, '_blank')}
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="h-8 w-8 p-0"
                onClick={onDelete}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Drag handle */}
          <div
            {...attributes}
            {...listeners}
            className="absolute bottom-3 left-3 cursor-move opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded p-1.5 shadow-lg"
          >
            <Move className="w-4 h-4" />
          </div>
        </div>

        {/* Image info panel */}
        <div className="p-4 space-y-3">
          {!image.is_main && (
            <Button
              size="sm"
              variant="outline"
              className="w-full"
              onClick={onSetMain}
            >
              <StarOff className="w-4 h-4 mr-2" />
              Set as Main Image
            </Button>
          )}

          {/* Alt text editor */}
          {!isEditingAlt ? (
            <div 
              className="text-sm text-gray-600 cursor-pointer hover:bg-gray-50 p-2 rounded border border-transparent hover:border-gray-200 transition-colors"
              onClick={() => setIsEditingAlt(true)}
            >
              <div className="flex items-center gap-2 mb-1">
                <ImageIcon className="w-3 h-3" />
                <span className="font-medium text-xs text-gray-500">DESCRIPTION</span>
              </div>
              <p className="text-sm">{altText || "Click to add description..."}</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={altText}
                onChange={(e) => setAltText(e.target.value)}
                placeholder="Image description for SEO and accessibility..."
                className="text-sm resize-none"
                rows={2}
              />
              <div className="flex gap-2">
                <Button size="sm" className="flex-1" onClick={handleAltTextSave}>
                  <Save className="w-3 h-3 mr-1" />
                  Save
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => {
                    setAltText(image.alt_text || "")
                    setIsEditingAlt(false)
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function ImageUploadCrop({ 
  images, 
  onImagesChange, 
  maxImages = 10,
  cropAspectRatio = 16/9 
}: ImageUploadCropProps) {
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState("")
  const [currentEditingImage, setCurrentEditingImage] = useState<PropertyImage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (images.length >= maxImages) {
      toast.error(`Maximum ${maxImages} images allowed`)
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload only image files')
      return
    }

    // Create URL for the image
    const url = URL.createObjectURL(file)
    setCurrentFile(file)
    setCurrentImageUrl(url)
    
    // Create temporary image for editing
    const tempImage: PropertyImage = {
      id: `temp_${Date.now()}`,
      url: url,
      alt_text: "",
      order_index: images.length,
      is_main: images.length === 0,
      originalFile: file
    }
    
    setCurrentEditingImage(tempImage)
    setCropDialogOpen(true)
  }, [images.length, maxImages])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    multiple: false,
    disabled: images.length >= maxImages
  })

  const handleCropSave = (croppedImage: { file: File; url: string }, altText: string) => {
    if (!currentEditingImage) return

    const newImage: PropertyImage = {
      ...currentEditingImage,
      url: croppedImage.url,
      alt_text: altText,
      file: croppedImage.file
    }

    onImagesChange([...images, newImage])
    
    setCropDialogOpen(false)
    setCurrentEditingImage(null)
    setCurrentFile(null)
    setCurrentImageUrl("")
    
    toast.success('Image added successfully!')
  }

  const handleEditImage = (image: PropertyImage) => {
    setCurrentEditingImage(image)
    setCropDialogOpen(true)
  }

  const handleDeleteImage = (imageId: string) => {
    const filteredImages = images.filter(img => img.id !== imageId)
    
    // If we deleted the main image, make the first remaining image the main one
    if (filteredImages.length > 0) {
      const hasMain = filteredImages.some(img => img.is_main)
      if (!hasMain) {
        filteredImages[0].is_main = true
      }
    }
    
    // Reorder indices
    const reorderedImages = filteredImages.map((img, index) => ({
      ...img,
      order_index: index
    }))
    
    onImagesChange(reorderedImages)
    toast.success('Image removed')
  }

  const handleSetMainImage = (imageId: string) => {
    const updatedImages = images.map(img => ({
      ...img,
      is_main: img.id === imageId
    }))
    onImagesChange(updatedImages)
    toast.success('Main image updated')
  }

  const handleUpdateAltText = (imageId: string, altText: string) => {
    const updatedImages = images.map(img =>
      img.id === imageId ? { ...img, alt_text: altText } : img
    )
    onImagesChange(updatedImages)
  }

  const handleDragEnd = (event: any) => {
    const { active, over } = event

    if (active.id !== over.id) {
      const oldIndex = images.findIndex(img => img.id === active.id)
      const newIndex = images.findIndex(img => img.id === over.id)
      
      const reorderedImages = arrayMove(images, oldIndex, newIndex).map((img, index) => ({
        ...img,
        order_index: index
      }))
      
      onImagesChange(reorderedImages)
    }
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      {images.length < maxImages && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-blue-500 bg-blue-50 scale-[1.02]'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center space-y-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-100' : 'bg-gray-100'}`}>
              <Upload className={`h-8 w-8 ${isDragActive ? 'text-blue-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {isDragActive ? 'Drop your images here' : 'Upload Property Images'}
              </h3>
              <p className="text-gray-600 mb-2">
                Drag & drop high-quality images here, or click to browse
              </p>
              <p className="text-sm text-gray-500">
                Supports JPG, PNG, WebP, GIF • Max {maxImages} images • Recommended: 1200x800px
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Images Grid */}
      {images.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Property Images ({images.length}/{maxImages})
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Drag to reorder • Click edit to crop • First image is the main thumbnail
              </p>
            </div>
          </div>
          
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={images.map(img => img.id)} strategy={verticalListSortingStrategy}>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {images.map((image) => (
                  <SortableImageItem
                    key={image.id}
                    image={image}
                    onEdit={() => handleEditImage(image)}
                    onDelete={() => handleDeleteImage(image.id)}
                    onSetMain={() => handleSetMainImage(image.id)}
                    onUpdateAltText={(altText) => handleUpdateAltText(image.id, altText)}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        </div>
      )}

      {/* Advanced Image Editor */}
      <ImageEditor
        image={currentEditingImage}
        isOpen={cropDialogOpen}
        onClose={() => {
          setCropDialogOpen(false)
          setCurrentEditingImage(null)
          setCurrentFile(null)
          setCurrentImageUrl("")
        }}
        onSave={handleCropSave}
      />
    </div>
  )
} 