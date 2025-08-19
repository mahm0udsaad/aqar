"use client"

import { useState } from "react"
import Image from "next/image"
import type { PropertyImage } from "@/lib/types"
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface PropertyGalleryProps {
  images: PropertyImage[]
  title: string
}

export function PropertyGallery({ images, title }: PropertyGalleryProps) {
  const [selectedImage, setSelectedImage] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const nextImage = () => {
    setSelectedImage((prev) => (prev + 1) % images.length)
  }

  const prevImage = () => {
    setSelectedImage((prev) => (prev - 1 + images.length) % images.length)
  }

  if (!images.length) return null

  return (
    <>
      <div className="space-y-4">
        {/* Main Image */}
        <div className="relative h-96 overflow-hidden rounded-lg cursor-pointer" onClick={() => setIsModalOpen(true)}>
          <Image
            src={images[selectedImage]?.url || "/placeholder.svg?height=400&width=600"}
            alt={images[selectedImage]?.alt || title}
            fill
            className="object-cover"
          />
          {images.length > 1 && (
            <>
              <Button
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  prevImage()
                }}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                onClick={(e) => {
                  e.stopPropagation()
                  nextImage()
                }}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>

        {/* Thumbnails */}
        {images.length > 1 && (
          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {images.map((image, index) => (
              <div
                key={image.id}
                className={`relative h-20 overflow-hidden rounded cursor-pointer border-2 transition-all ${
                  selectedImage === index ? "border-primary" : "border-transparent hover:border-gray-300"
                }`}
                onClick={() => setSelectedImage(index)}
              >
                <Image src={image.url || "/placeholder.svg"} alt={image.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Enhanced Modal with Full Screen */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-7xl w-full h-full p-0 bg-black/95">
          <div className="relative w-full h-full">
            {/* Close button */}
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-4 top-4 z-50 bg-black/50 hover:bg-black/70 text-white border-white/20"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
            
            {/* Main image container - full screen */}
            <div className="relative w-full h-[90vh] flex items-center justify-center">
              <Image
                src={images[selectedImage]?.url || "/placeholder.svg"}
                alt={images[selectedImage]?.alt || title}
                fill
                className="object-contain"
                quality={100}
                priority
                sizes="100vw"
              />
              
              {/* Navigation arrows */}
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-white/20 w-12 h-12"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white border-white/20 w-12 h-12"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-6 h-6" />
                  </Button>
                </>
              )}
              
              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/50 text-white px-4 py-2 rounded-full text-sm">
                  {selectedImage + 1} / {images.length}
                </div>
              )}
            </div>
            
            {/* Thumbnail strip at bottom */}
            {images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-full max-w-4xl px-8">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide justify-center">
                  {images.map((image, index) => (
                    <div
                      key={image.id}
                      className={`relative w-16 h-16 flex-shrink-0 overflow-hidden rounded cursor-pointer border-2 transition-all ${
                        selectedImage === index 
                          ? "border-white" 
                          : "border-transparent hover:border-white/50"
                      }`}
                      onClick={() => setSelectedImage(index)}
                    >
                      <Image 
                        src={image.url || "/placeholder.svg"} 
                        alt={image.alt} 
                        fill 
                        className="object-cover" 
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
