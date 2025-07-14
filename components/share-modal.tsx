"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Share2, Facebook, MessageCircle, Copy, Check } from "lucide-react"
import type { PropertyWithDetails } from "@/lib/supabase/queries"

interface ShareModalProps {
  property: PropertyWithDetails
  isOpen: boolean
  onClose: () => void
}

export function ShareModal({ property, isOpen, onClose }: ShareModalProps) {
  const [copied, setCopied] = useState(false)

  const propertyUrl = `${
    typeof window !== "undefined" ? window.location.origin : ""
  }/properties/${property.id}`
  const shareText = `Check out this amazing property: ${
    property.title
  } - ${property.price?.toLocaleString()} EGP`

  const shareOptions = [
    {
      name: "Facebook",
      icon: Facebook,
      color: "bg-blue-600 hover:bg-blue-700",
      action: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
            propertyUrl,
          )}`,
          "_blank",
          "width=600,height=400",
        )
      },
    },
    {
      name: "Instagram",
      icon: () => (
        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
        </svg>
      ),
      color:
        "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
      action: () => {
        // Instagram doesn't have direct sharing URL, so we copy to clipboard
        navigator.clipboard.writeText(`${shareText} ${propertyUrl}`)
        alert(
          "Link copied! You can now paste it in your Instagram story or post.",
        )
      },
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      color: "bg-green-600 hover:bg-green-700",
      action: () => {
        window.open(
          `https://wa.me/?text=${encodeURIComponent(`${shareText} ${propertyUrl}`)}`,
          "_blank",
        )
      },
    },
  ]

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(propertyUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy: ", err)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            Share Property
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Property Preview */}
          <div className="p-4 bg-muted rounded-lg">
            <h3 className="font-semibold text-sm line-clamp-2 mb-1">
              {property.title}
            </h3>
            <p className="text-sm text-muted-foreground">
              {property.location}, {property.area}
            </p>
            <p className="text-sm font-medium text-primary">
              {property.price?.toLocaleString()} EGP
            </p>
          </div>

          {/* Social Media Sharing */}
          <div>
            <Label className="text-sm font-medium mb-3 block">
              Share on Social Media
            </Label>
            <div className="grid grid-cols-1 gap-3">
              {shareOptions.map((option) => (
                <Button
                  key={option.name}
                  onClick={option.action}
                  className={`${option.color} text-white flex items-center gap-2 justify-start`}
                >
                  <option.icon className="w-4 h-4" />
                  {option.name}
                </Button>
              ))}
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <Label className="text-sm font-medium mb-3 block">Copy Link</Label>
            <div className="flex gap-2">
              <Input
                value={propertyUrl}
                readOnly
                className="flex-1 text-sm"
              />
              <Button
                onClick={copyToClipboard}
                variant="outline"
                className="flex items-center gap-2 bg-transparent"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 text-green-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
