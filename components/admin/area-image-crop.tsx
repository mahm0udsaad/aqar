"use client"

import { useState, useCallback, useEffect } from "react"
import Cropper from "react-easy-crop"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { toast } from "sonner"
import { 
  Crop as CropIcon,
  Save,
  Loader2,
  ZoomIn,
  RotateCw,
} from "lucide-react"
import { uploadImages } from "@/lib/actions/uploads"

interface CropData {
  x: number
  y: number
  width: number
  height: number
}

interface AreaImageCropProps {
  file: File | null
  isOpen: boolean
  onClose: () => void
  onSave: (imageUrl: string) => void
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
  rotation = 0
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
        const file = new File([blob], 'cropped-area-image.jpg', { type: 'image/jpeg' })
        const url = URL.createObjectURL(blob)
        resolve({ file, url })
      }
    }, 'image/jpeg', 0.9)
  })
}

export function AreaImageCrop({ file, isOpen, onClose, onSave }: AreaImageCropProps) {
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropData | null>(null)
  const [aspectRatio, setAspectRatio] = useState(16 / 9)
  const [isProcessing, setIsProcessing] = useState(false)
  const [imageUrl, setImageUrl] = useState<string>("")

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      setCrop({ x: 0, y: 0 })
      setZoom(1)
      setRotation(0)
      
      // Cleanup function
      return () => {
        URL.revokeObjectURL(url)
      }
    }
  }, [file])

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: CropData) => {
    setCroppedAreaPixels(croppedAreaPixels)
  }, [])

  const handleSave = async () => {
    if (!file || !croppedAreaPixels || !imageUrl) return

    setIsProcessing(true)
    try {
      // First crop the image
      const croppedImage = await getCroppedImg(
        imageUrl,
        croppedAreaPixels,
        rotation
      )
      
      // Then upload the cropped image
      const formData = new FormData()
      formData.append("files", croppedImage.file)
      formData.append("bucket", "property-images")
      formData.append("prefix", "areas")
      
      const result = await uploadImages({ success: false }, formData)
      
      if (!result.success || !result.urls || result.urls.length === 0) {
        throw new Error(result.message || "Upload failed")
      }
      
      const uploadedUrl = result.urls[0]
      onSave(uploadedUrl)
      onClose()
      
      toast.success('Image cropped and uploaded successfully!')
    } catch (error) {
      console.error('Error processing image:', error)
      toast.error('Failed to process and upload image')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetTransforms = () => {
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
  }

  if (!file || !imageUrl) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CropIcon className="w-5 h-5" />
            Crop Area Image
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(90vh-120px)]">
          {/* Crop Area */}
          <div className="flex-1 relative bg-black rounded-lg overflow-hidden min-h-[300px]">
            <Cropper
              image={imageUrl}
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
              </CardContent>
            </Card>

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

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={resetTransforms}
                variant="outline"
                className="w-full"
              >
                Reset
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
                      Save & Upload
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
