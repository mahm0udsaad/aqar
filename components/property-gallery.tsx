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

      {/* Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-4xl p-0">
          <div className="relative">
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2 z-10 bg-black/50 hover:bg-black/70 text-white"
              onClick={() => setIsModalOpen(false)}
            >
              <X className="w-4 h-4" />
            </Button>
            <div className="relative h-[70vh]">
              <Image
                src={images[selectedImage]?.url || "/placeholder.svg?height=400&width=600"}
                alt={images[selectedImage]?.alt || title}
                fill
                className="object-contain"
              />
              {images.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={prevImage}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white"
                    onClick={nextImage}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
