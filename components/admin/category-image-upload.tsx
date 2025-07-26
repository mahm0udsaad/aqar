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

export interface CategoryImage {
  id: string
  url: string
  alt_text: string | null
  file?: File
  originalFile?: File
}

interface CategoryImageUploadProps {
  image: CategoryImage | null
  onImageChange: (image: CategoryImage | null) => void
  cropAspectRatio?: number
}

interface CropData {
  x: number
  y: number
  width: number
  height: number
}

// Helper function to create image element
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', error => reject(error))
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
        const file = new File([blob], 'cropped-category-image.jpg', { type: 'image/jpeg' })
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
  image: CategoryImage | null
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
              Category Image Editor
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
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Zoom</Label>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-4 h-4" />
                    <span className="text-sm">{Math.round(zoom * 100)}%</span>
                    <ZoomIn className="w-4 h-4" />
                  </div>
                </div>
                <Slider
                  value={[zoom]}
                  onValueChange={([value]) => setZoom(value)}
                  min={1}
                  max={3}
                  step={0.1}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Rotation Control */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="font-medium">Rotation</Label>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setRotation(rotation + 90)}
                  >
                    <RotateCw className="w-4 h-4" />
                  </Button>
                </div>
                <Slider
                  value={[rotation]}
                  onValueChange={([value]) => setRotation(value)}
                  min={0}
                  max={360}
                  step={1}
                  className="w-full"
                />
              </CardContent>
            </Card>

            {/* Flip Controls */}
            <Card>
              <CardContent className="p-4 space-y-4">
                <Label className="font-medium">Flip</Label>
                <div className="flex gap-2">
                  <Button
                    variant={flip.horizontal ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlip(prev => ({ ...prev, horizontal: !prev.horizontal }))}
                    className="flex-1"
                  >
                    <FlipHorizontal className="w-4 h-4 mr-2" />
                    Horizontal
                  </Button>
                  <Button
                    variant={flip.vertical ? "default" : "outline"}
                    size="sm"
                    onClick={() => setFlip(prev => ({ ...prev, vertical: !prev.vertical }))}
                    className="flex-1"
                  >
                    <FlipVertical className="w-4 h-4 mr-2" />
                    Vertical
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Image Description */}
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

export function CategoryImageUpload({ 
  image, 
  onImageChange, 
  cropAspectRatio = 16/9 
}: CategoryImageUploadProps) {
  const [cropDialogOpen, setCropDialogOpen] = useState(false)
  const [currentFile, setCurrentFile] = useState<File | null>(null)
  const [currentImageUrl, setCurrentImageUrl] = useState("")
  const [currentEditingImage, setCurrentEditingImage] = useState<CategoryImage | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
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
    const tempImage: CategoryImage = {
      id: `temp_${Date.now()}`,
      url: url,
      alt_text: "",
      originalFile: file
    }
    
    setCurrentEditingImage(tempImage)
    setCropDialogOpen(true)
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.gif']
    },
    multiple: false
  })

  const handleCropSave = (croppedImage: { file: File; url: string }, altText: string) => {
    if (!currentEditingImage) return

    const newImage: CategoryImage = {
      ...currentEditingImage,
      url: croppedImage.url,
      alt_text: altText,
      file: croppedImage.file
    }

    onImageChange(newImage)
    
    setCropDialogOpen(false)
    setCurrentEditingImage(null)
    setCurrentFile(null)
    setCurrentImageUrl("")
    
    toast.success('Category image updated successfully!')
  }

  const handleEditImage = (image: CategoryImage) => {
    setCurrentEditingImage(image)
    setCropDialogOpen(true)
  }

  const handleRemoveImage = () => {
    onImageChange(null)
    toast.success('Category image removed')
  }

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
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
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragActive ? 'Drop your image here' : 'Upload Category Image'}
            </h3>
            <p className="text-gray-600 mb-2">
              Drag & drop a high-quality image here, or click to browse
            </p>
            <p className="text-sm text-gray-500">
              Supports JPG, PNG, WebP, GIF • Recommended: 800x600px
            </p>
          </div>
        </div>
      </div>

      {/* Current Image Display */}
      {image && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Category Image
            </h3>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleEditImage(image)}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(image.url, '_blank')}
              >
                <Eye className="w-4 h-4 mr-2" />
                View
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveImage}
              >
                <X className="w-4 h-4 mr-2" />
                Remove
              </Button>
            </div>
          </div>
          
          <Card>
            <CardContent className="p-0">
              <div className="relative overflow-hidden rounded-lg">
                <img
                  src={image.url}
                  alt={image.alt_text || "Category image"}
                  className="w-full h-64 object-cover"
                />
                {image.alt_text && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-3">
                    <p className="text-sm">{image.alt_text}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
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