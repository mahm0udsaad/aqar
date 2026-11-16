"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { startConversation } from "@/lib/actions/chat"
import { tr } from "@/lib/listing-options"

export function MessageOwnerDialog({
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
  const router = useRouter()
  const suggestions =
    lng === "ar"
      ? ["هل العقار ما زال متاحاً؟", "هل السعر قابل للتفاوض؟", "أريد معاينة العقار، ما المواعيد المناسبة؟"]
      : ["Is it still available?", "Is the price negotiable?", "I'd like to view it. When suits you?"]
  const [body, setBody] = useState(suggestions[0])
  const [pending, start] = useTransition()

  const send = () =>
    start(async () => {
      const res = await startConversation(propertyId, body, lng)
      if (!res.success) {
        toast.error(res.message)
        return
      }
      onOpenChange(false)
      router.push(`/${lng}/account/messages/${res.id}`)
    })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir={lng === "ar" ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{tr(lng, "راسل المعلن", "Message the advertiser")}</DialogTitle>
          <DialogDescription>{tr(lng, "يصل الرد إلى صفحة رسائلك في عقار.", "Replies arrive in your Aqar messages.")}</DialogDescription>
        </DialogHeader>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => setBody(s)} className="text-xs rounded-full border px-3 py-1 hover:border-primary">
              {s}
            </button>
          ))}
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} maxLength={2000} />
        <DialogFooter>
          <Button onClick={send} disabled={pending || !body.trim()}>
            {pending ? tr(lng, "جارٍ الإرسال…", "Sending…") : tr(lng, "إرسال", "Send")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
