"use client"

import type React from "react"
import { createContext, useCallback, useContext, useEffect, useState, useTransition } from "react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import { Loader2, Maximize2, MessagesSquare, X } from "lucide-react"
import { toast } from "sonner"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { ChatThread } from "@/components/chat/chat-thread"
import { useAuth } from "@/lib/auth/auth-context"
import {
  findMyConversationForListing,
  getConversation,
  getConversationHeader,
  getInbox,
  startConversation,
  type ChatMessage,
  type ConversationSummary,
} from "@/lib/actions/chat"
import { tr } from "@/lib/listing-options"
import { assetUrl, cn } from "@/lib/utils"

type View =
  | { type: "inbox" }
  | { type: "thread"; id: string; text?: string }
  | { type: "new"; propertyId: string; title: string; text?: string }

interface ChatContextType {
  openInbox: () => void
  openThread: (id: string) => void
  /** From a listing: continues the buyer's conversation about it, or starts a new one (optionally with a ready message) */
  openForListing: (propertyId: string, title: string, text?: string) => void
}

const ChatContext = createContext<ChatContextType | undefined>(undefined)

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChat must be used within ChatProvider")
  return ctx
}

export function ChatProvider({ children, lng }: { children: React.ReactNode; lng: string }) {
  const { profile, openSignIn, refresh } = useAuth()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [view, setView] = useState<View>({ type: "inbox" })
  const t = (ar: string, en: string) => tr(lng, ar, en)

  const openInbox = useCallback(() => {
    if (!profile) return openSignIn()
    setView({ type: "inbox" })
    setOpen(true)
  }, [profile, openSignIn])

  const openThread = useCallback(
    (id: string) => {
      if (!profile) return openSignIn()
      setView({ type: "thread", id })
      setOpen(true)
    },
    [profile, openSignIn],
  )

  const openForListing = useCallback(
    async (propertyId: string, title: string, text?: string) => {
      if (!profile) return openSignIn()
      setView({ type: "new", propertyId, title, text })
      setOpen(true)
      const existing = await findMyConversationForListing(propertyId)
      if (existing) setView({ type: "thread", id: existing, text })
    },
    [profile, openSignIn],
  )

  const hideLauncher = !profile || pathname.includes("/account/messages") || pathname.includes("/admin")
  const unread = profile?.unread_messages || 0

  return (
    <ChatContext.Provider value={{ openInbox, openThread, openForListing }}>
      {children}

      {!hideLauncher && (
        <button
          type="button"
          onClick={openInbox}
          className={cn(
            "fixed bottom-5 z-40 h-14 w-14 rounded-full shadow-lg bg-background border flex items-center justify-center hover:bg-muted",
            lng === "ar" ? "right-5" : "left-5",
          )}
          aria-label={t("الرسائل", "Messages")}
        >
          <MessagesSquare className="h-6 w-6" />
          {unread > 0 && (
            <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[11px] leading-5 text-center">{unread}</span>
          )}
        </button>
      )}

      <Sheet open={open} onOpenChange={(o) => { setOpen(o); if (!o) refresh() }}>
        <SheetContent
          side={lng === "ar" ? "left" : "right"}
          className="p-0 w-full sm:max-w-md flex flex-col gap-0 [&>button]:hidden"
          dir={lng === "ar" ? "rtl" : "ltr"}
        >
          <SheetTitle className="sr-only">{t("الرسائل", "Messages")}</SheetTitle>
          {view.type === "inbox" && <PanelInbox lng={lng} onPick={(id) => setView({ type: "thread", id })} onClose={() => setOpen(false)} />}
          {view.type === "thread" && <PanelThread key={view.id} lng={lng} id={view.id} draft={view.text} onBack={() => setView({ type: "inbox" })} />}
          {view.type === "new" && (
            <PanelNew
              lng={lng}
              propertyId={view.propertyId}
              title={view.title}
              initialText={view.text}
              onSent={(id) => setView({ type: "thread", id })}
              onClose={() => setOpen(false)}
            />
          )}
        </SheetContent>
      </Sheet>
    </ChatContext.Provider>
  )
}

function PanelHeader({ lng, title, onClose, expandHref }: { lng: string; title: string; onClose: () => void; expandHref?: string }) {
  return (
    <div className="flex items-center justify-between p-3 border-b">
      <div className="font-semibold">{title}</div>
      <div className="flex items-center gap-1">
        {expandHref && (
          <Link href={expandHref} onClick={onClose} className="p-2 rounded hover:bg-muted" aria-label={tr(lng, "فتح في صفحة كاملة", "Open full page")}>
            <Maximize2 className="w-4 h-4" />
          </Link>
        )}
        <button type="button" onClick={onClose} className="p-2 rounded hover:bg-muted" aria-label={tr(lng, "إغلاق", "Close")}>
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}

function PanelInbox({ lng, onPick, onClose }: { lng: string; onPick: (id: string) => void; onClose: () => void }) {
  const [items, setItems] = useState<ConversationSummary[] | null>(null)
  useEffect(() => {
    getInbox().then((r) => setItems(r || []))
  }, [])
  const when = (d: string) =>
    new Date(d).toLocaleString(lng === "ar" ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <>
      <PanelHeader lng={lng} title={tr(lng, "الرسائل", "Messages")} onClose={onClose} expandHref={`/${lng}/account/messages`} />
      <div className="flex-1 overflow-y-auto">
        {items === null ? (
          <div className="p-8 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-sm">
            {tr(lng, "لا توجد محادثات بعد. اضغط \"راسل المعلن\" في أي إعلان لتبدأ.", "No conversations yet. Tap \"Message\" on any listing to start.")}
          </div>
        ) : (
          <div className="divide-y">
            {items.map((c) => (
              <button key={c.id} type="button" onClick={() => onPick(c.id)} className="w-full flex gap-3 p-3 text-start hover:bg-muted/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={assetUrl(c.property_thumb || "/placeholder.svg")} alt="" className="w-12 h-12 rounded object-cover bg-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between gap-2">
                    <span className={cn("truncate text-sm", c.unread ? "font-bold" : "font-medium")}>{c.other_name}</span>
                    <span className="text-[11px] text-muted-foreground shrink-0">{when(c.last_message_at)}</span>
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{c.property_title}</div>
                  <div className={cn("text-sm truncate", c.unread ? "font-semibold" : "text-muted-foreground")}>{c.last_message}</div>
                </div>
                {c.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary self-center shrink-0" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  )
}

function PanelThread({ lng, id, onBack, draft }: { lng: string; id: string; onBack: () => void; draft?: string }) {
  const [data, setData] = useState<{ header: any; me: string; messages: ChatMessage[] } | null | "missing">(null)
  useEffect(() => {
    let alive = true
    Promise.all([getConversationHeader(id), getConversation(id)]).then(([header, convo]) => {
      if (!alive) return
      setData(header && convo ? { header, me: convo.me, messages: convo.messages } : "missing")
    })
    return () => {
      alive = false
    }
  }, [id])

  if (data === null) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }
  if (data === "missing") {
    return (
      <div className="p-8 text-center text-sm text-muted-foreground">
        {tr(lng, "المحادثة غير موجودة.", "Conversation not found.")}
        <Button variant="link" onClick={onBack}>{tr(lng, "رجوع", "Back")}</Button>
      </div>
    )
  }
  return <ChatThread lng={lng} conversationId={id} me={data.me} header={data.header} initialMessages={data.messages} embedded onBack={onBack} initialDraft={draft} />
}

function PanelNew({
  lng,
  propertyId,
  title,
  initialText,
  onSent,
  onClose,
}: {
  lng: string
  propertyId: string
  title: string
  initialText?: string
  onSent: (id: string) => void
  onClose: () => void
}) {
  const suggestions =
    lng === "ar"
      ? ["هل العقار ما زال متاحاً؟", "هل السعر قابل للتفاوض؟", "أريد معاينة العقار، ما المواعيد المناسبة؟"]
      : ["Is it still available?", "Is the price negotiable?", "I'd like to view it. When suits you?"]
  const [body, setBody] = useState(initialText || suggestions[0])
  const [pending, start] = useTransition()
  const { refresh } = useAuth()

  const send = () =>
    start(async () => {
      const res = await startConversation(propertyId, body, lng)
      if (!res.success) {
        toast.error(res.message)
        return
      }
      refresh()
      onSent(res.id)
    })

  return (
    <>
      <PanelHeader lng={lng} title={tr(lng, "راسل المعلن", "Message the advertiser")} onClose={onClose} />
      <div className="p-4 space-y-4 flex-1 overflow-y-auto">
        <div className="text-sm text-muted-foreground">{title}</div>
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button key={s} type="button" onClick={() => setBody(s)} className="text-xs rounded-full border px-3 py-1 hover:border-primary">
              {s}
            </button>
          ))}
        </div>
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} maxLength={2000} />
        <Button className="w-full" onClick={send} disabled={pending || !body.trim()}>
          {pending ? tr(lng, "جارٍ الإرسال…", "Sending…") : tr(lng, "إرسال", "Send")}
        </Button>
        <p className="text-xs text-muted-foreground">
          {tr(lng, "المحادثة تبقى هنا داخل عقار. لا تحوّل أي أموال قبل معاينة العقار.", "The conversation stays here on Aqar. Never send money before viewing the property.")}
        </p>
      </div>
    </>
  )
}
