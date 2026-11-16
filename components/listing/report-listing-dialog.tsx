"use client"

import { useState, useTransition } from "react"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { reportListing } from "@/lib/actions/listings"
import { REPORT_REASONS, tr, type ReportReason } from "@/lib/listing-options"

export function ReportListingDialog({
  lng,
  propertyId,
  open,
  onOpenChange,
}: {
  lng: string
  propertyId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const [reason, setReason] = useState<ReportReason | "">("")
  const [details, setDetails] = useState("")
  const [pending, start] = useTransition()

  const submit = () => {
    if (!reason) return
    start(async () => {
      const res = await reportListing({ propertyId, reason, details }, lng)
      if (res.success) {
        toast.success(tr(lng, "شكراً، سنراجع البلاغ", "Thanks, we'll review your report"))
        onOpenChange(false)
        setReason("")
        setDetails("")
      } else {
        toast.error(res.message)
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={lng === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{tr(lng, "إبلاغ عن الإعلان", "Report this listing")}</DialogTitle>
          <DialogDescription>{tr(lng, "ما المشكلة في هذا الإعلان؟", "What's wrong with this listing?")}</DialogDescription>
        </DialogHeader>
        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)} className="gap-2">
          {REPORT_REASONS.map((r) => (
            <Label key={r.value} className="flex items-center gap-3 rounded-md border p-3 cursor-pointer font-normal has-[:checked]:border-primary">
              <RadioGroupItem value={r.value} />
              {lng === "ar" ? r.ar : r.en}
            </Label>
          ))}
        </RadioGroup>
        <Textarea
          placeholder={tr(lng, "تفاصيل إضافية (اختياري)", "More details (optional)")}
          value={details}
          maxLength={1000}
          onChange={(e) => setDetails(e.target.value)}
        />
        <DialogFooter>
          <Button onClick={submit} disabled={!reason || pending} variant="destructive">
            {pending ? tr(lng, "جارٍ الإرسال…", "Sending…") : tr(lng, "إرسال البلاغ", "Send report")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
