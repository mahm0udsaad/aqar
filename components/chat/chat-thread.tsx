"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import Link from "next/link"
import { ArrowLeft, ArrowRight, Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { getConversation, sendMessage, type ChatMessage } from "@/lib/actions/chat"
import { useAuth } from "@/lib/auth/auth-context"
import { tr } from "@/lib/listing-options"
import { assetUrl, cn } from "@/lib/utils"

const POLL_MS = 5000

export function ChatThread({
  lng,
  conversationId,
  me,
  header,
  initialMessages,
}: {
  lng: string
  conversationId: string
  me: string
  header: any
  initialMessages: ChatMessage[]
}) {
  const t = (ar: string, en: string) => tr(lng, ar, en)
  const { refresh } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages)
  const [text, setText] = useState("")
  const [pending, start] = useTransition()
  const bottom = useRef<HTMLDivElement>(null)
  const lastId = messages.length ? messages[messages.length - 1].id : 0
  const Back = lng === "ar" ? ArrowRight : ArrowLeft

  useEffect(() => {
    bottom.current?.scrollIntoView({ block: "end" })
  }, [messages.length])

  // the unread badge clears once the thread is opened
  useEffect(() => {
    refresh()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // poll for new messages while the tab is visible
  useEffect(() => {
    const tick = async () => {
      if (document.visibilityState !== "visible") return
      const res = await getConversation(conversationId, lastId)
      if (res?.messages.length) {
        setMessages((prev) => {
          const seen = new Set(prev.map((m) => m.id))
          return [...prev, ...res.messages.filter((m) => !seen.has(m.id))]
        })
      }
    }
    const timer = setInterval(tick, POLL_MS)
    return () => clearInterval(timer)
  }, [conversationId, lastId])

  const send = () => {
    const body = text.trim()
    if (!body) return
    start(async () => {
      const res = await sendMessage(conversationId, body, lng)
      if (!res.success) {
        toast.error(res.message)
        return
      }
      setText("")
      setMessages((prev) => (prev.some((m) => m.id === res.message.id) ? prev : [...prev, res.message]))
    })
  }

  const fmtTime = (d: string) => new Date(d).toLocaleTimeString(lng === "ar" ? "ar-EG" : "en-GB", { hour: "2-digit", minute: "2-digit" })
  const fmtDay = (d: string) => new Date(d).toLocaleDateString(lng === "ar" ? "ar-EG" : "en-GB", { weekday: "long", day: "numeric", month: "long" })
  const closed = header.property_status !== "active" || header.moderation_status !== "approved"

  return (
    <div className="flex flex-col h-[calc(100dvh-4rem)] sm:h-[calc(100dvh-7rem)] bg-background sm:rounded-lg sm:border overflow-hidden">
      <div className="flex items-center gap-3 p-3 border-b">
        <Link href={`/${lng}/account/messages`} className="p-1" aria-label={t("رجوع للرسائل", "Back to messages")}>
          <Back className="w-5 h-5" />
        </Link>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={assetUrl(header.property_thumb || "/placeholder.svg")} alt="" className="w-11 h-11 rounded object-cover bg-muted" />
        <div className="min-w-0 flex-1">
          <div className="font-semibold truncate">{header.other_name}</div>
          <Link href={`/${lng}/properties/${header.property_id}`} className="text-xs text-muted-foreground truncate block hover:underline">
            {header.property_title} · {Number(header.property_price).toLocaleString(lng === "ar" ? "ar-EG" : "en-US")} {t("ج.م", "EGP")}
          </Link>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2 bg-muted/30">
        {messages.map((m, i) => {
          const mine = m.sender_id === me
          const newDay = i === 0 || new Date(messages[i - 1].created_at).toDateString() !== new Date(m.created_at).toDateString()
          return (
            <div key={m.id}>
              {newDay && <div className="text-center text-xs text-muted-foreground my-3">{fmtDay(m.created_at)}</div>}
              <div className={cn("flex", mine ? "justify-end" : "justify-start")}>
                <div className={cn("max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words", mine ? "bg-primary text-primary-foreground" : "bg-background border")}>
                  {m.body}
                  <div className={cn("text-[10px] mt-1", mine ? "text-primary-foreground/70" : "text-muted-foreground")}>{fmtTime(m.created_at)}</div>
                </div>
              </div>
            </div>
          )
        })}
        <div ref={bottom} />
      </div>

      {closed && (
        <div className="px-4 py-2 text-xs text-center bg-amber-50 text-amber-900 border-t">
          {t("هذا الإعلان لم يعد متاحاً للعامة، لكن يمكنكما مواصلة المحادثة.", "This listing is no longer public, but you can keep chatting.")}
        </div>
      )}
      <div className="border-t p-3 flex gap-2 items-end">
        <Textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault()
              send()
            }
          }}
          rows={1}
          maxLength={2000}
          placeholder={t("اكتب رسالة…", "Write a message…")}
          className="min-h-[44px] max-h-32 resize-none"
        />
        <Button onClick={send} disabled={pending || !text.trim()} size="icon" className="h-11 w-11 shrink-0" aria-label={t("إرسال", "Send")}>
          <Send className={cn("w-5 h-5", lng === "ar" && "-scale-x-100")} />
        </Button>
      </div>
      <p className="text-[11px] text-muted-foreground text-center pb-2">{t("لا تحوّل أي أموال قبل معاينة العقار والتأكد من المالك.", "Never send money before viewing the property and checking the owner.")}</p>
    </div>
  )
}
