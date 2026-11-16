"use client"

import { useCallback, useEffect, useState } from "react"
import Cropper, { type Area } from "react-easy-crop"
import { RectangleHorizontal, RectangleVertical, RotateCcw, RotateCw, Square, ImageIcon } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { tr } from "@/lib/listing-options"
import { cn } from "@/lib/utils"

type Shape = "landscape" | "portrait" | "square" | "original"

const SHAPES: { value: Shape; ar: string; en: string; icon: typeof Square }[] = [
  { value: "landscape", ar: "أفقي", en: "Landscape", icon: RectangleHorizontal },
  { value: "portrait", ar: "رأسي", en: "Portrait", icon: RectangleVertical },
  { value: "square", ar: "مربع", en: "Square", icon: Square },
  { value: "original", ar: "الأصلي", en: "Original", icon: ImageIcon },
]

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Rotates the whole photo, then cuts out the chosen area; returns a JPEG (max 2000px on the long side). */
async function renderCrop(src: string, area: Area, rotation: number): Promise<Blob> {
  const img = await loadImage(src)
  const rad = (rotation * Math.PI) / 180
  const sin = Math.abs(Math.sin(rad))
  const cos = Math.abs(Math.cos(rad))
  const bw = img.width * cos + img.height * sin
  const bh = img.width * sin + img.height * cos

  const rotated = document.createElement("canvas")
  rotated.width = Math.round(bw)
  rotated.height = Math.round(bh)
  const rctx = rotated.getContext("2d")!
  rctx.translate(bw / 2, bh / 2)
  rctx.rotate(rad)
  rctx.drawImage(img, -img.width / 2, -img.height / 2)

  const scale = Math.min(1, 2000 / Math.max(area.width, area.height))
  const out = document.createElement("canvas")
  out.width = Math.round(area.width * scale)
  out.height = Math.round(area.height * scale)
  out.getContext("2d")!.drawImage(rotated, area.x, area.y, area.width, area.height, 0, 0, out.width, out.height)

  return new Promise((resolve, reject) => out.toBlob((b) => (b ? resolve(b) : reject(new Error("crop failed"))), "image/jpeg", 0.88))
}

export interface PhotoEditorProps {
  lng: string
  /** object URL of a new file, or the URL of an uploaded photo (same origin) */
  src: string | null
  fileName?: string
  /** e.g. "2 / 5" when editing a batch */
  progressLabel?: string
  onApply: (file: File) => void
  /** Use the photo as it is */
  onSkip: () => void
  onCancel: () => void
  /** Use the remaining photos of a batch as they are */
  onSkipAll?: () => void
}

export function PhotoEditorDialog({ lng, src, fileName, progressLabel, onApply, onSkip, onCancel, onSkipAll }: PhotoEditorProps) {
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const [shape, setShape] = useState<Shape>("landscape")
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)
  const [area, setArea] = useState<Area | null>(null)
  const [natural, setNatural] = useState<number>(4 / 3)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!src) return
    setCrop({ x: 0, y: 0 })
    setZoom(1)
    setRotation(0)
    setBusy(false)
    loadImage(src)
      .then((img) => {
        const ratio = img.width / img.height
        setNatural(ratio)
        // start from the photo's own orientation
        setShape(ratio < 0.95 ? "portrait" : ratio > 1.05 ? "landscape" : "square")
      })
      .catch(() => {})
  }, [src])

  const rotatedNatural = rotation % 180 === 0 ? natural : 1 / natural
  const aspect = shape === "landscape" ? 4 / 3 : shape === "portrait" ? 3 / 4 : shape === "square" ? 1 : rotatedNatural

  const onComplete = useCallback((_: Area, pixels: Area) => setArea(pixels), [])

  const apply = async () => {
    if (!src || !area) return
    setBusy(true)
    try {
      const blob = await renderCrop(src, area, rotation)
      const name = (fileName || "photo").replace(/\.[^.]+$/, "") + ".jpg"
      onApply(new File([blob], name, { type: "image/jpeg" }))
    } catch {
      setBusy(false)
    }
  }

  return (
    <Dialog open={!!src} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-2xl p-4 sm:p-6" dir={lng === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {t("تعديل الصورة", "Edit photo")}
            {progressLabel && <span className="text-sm font-normal text-muted-foreground">({progressLabel})</span>}
          </DialogTitle>
          <DialogDescription>{t("اختر الشكل وحرّك الصورة داخل الإطار. يمكنك التكبير والتدوير.", "Pick a shape and drag the photo inside the frame. You can zoom and rotate.")}</DialogDescription>
        </DialogHeader>

        <div className="relative w-full h-[50vh] min-h-64 bg-black rounded-md overflow-hidden" dir="ltr">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={onComplete}
              objectFit="contain"
              showGrid
            />
          )}
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          {SHAPES.map((s) => (
            <button
              key={s.value}
              type="button"
              onClick={() => setShape(s.value)}
              aria-pressed={shape === s.value}
              className={cn(
                "flex items-center gap-2 rounded-full border px-4 py-2 text-sm",
                shape === s.value ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary/60",
              )}
            >
              <s.icon className="w-4 h-4" />
              {lng === "ar" ? s.ar : s.en}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Button type="button" variant="outline" size="icon" onClick={() => setRotation((r) => (r + 270) % 360)} aria-label={t("تدوير لليسار", "Rotate left")}>
            <RotateCcw className="w-4 h-4" />
          </Button>
          <div className="flex-1" dir="ltr">
            <Slider value={[zoom]} min={1} max={3} step={0.05} onValueChange={([z]) => setZoom(z)} aria-label={t("تكبير", "Zoom")} />
          </div>
          <Button type="button" variant="outline" size="icon" onClick={() => setRotation((r) => (r + 90) % 360)} aria-label={t("تدوير لليمين", "Rotate right")}>
            <RotateCw className="w-4 h-4" />
          </Button>
        </div>

        <DialogFooter className="gap-2 sm:gap-2 flex-col-reverse sm:flex-row">
          {onSkipAll && (
            <Button type="button" variant="ghost" onClick={onSkipAll} disabled={busy}>
              {t("استخدم الباقي بدون تعديل", "Use the rest as they are")}
            </Button>
          )}
          <Button type="button" variant="outline" onClick={onSkip} disabled={busy}>
            {t("بدون تعديل", "Use as is")}
          </Button>
          <Button type="button" onClick={apply} disabled={busy || !area}>
            {busy ? t("جارٍ الحفظ…", "Saving…") : t("تطبيق", "Apply")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
