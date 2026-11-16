"use client"

import { toast } from "sonner"
import { useEffect, useState } from "react"
import { BadgeCheck, Flag, MessageCircle, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { trackListingEvent } from "@/lib/actions/listings"
import { formatEgyptPhone, normalizeEgyptPhone, tr } from "@/lib/listing-options"
import { ReportListingDialog } from "./report-listing-dialog"
import { rememberViewed } from "./suggested-for-you"
import { useChat } from "@/components/chat/chat-dock"
import { useAuth } from "@/lib/auth/auth-context"
import { MessagesSquare } from "lucide-react"

interface ContactCardProps {
  lng: string
  propertyId: string
  title: string
  contactName: string | null
  contactPhone: string | null
  contactWhatsapp: string | null
  ownerType: string | null
  owner?: {
    full_name?: string | null
    office_name?: string | null
    is_verified_broker?: boolean
    created_at?: string | null
    account_type?: string | null
  } | null
  /** Only track clicks on public, approved listings */
  trackable?: boolean
  /** Listings posted by a user (not by the site admin) can receive in-site messages */
  ownerId?: string | null
}

export function ContactCard(props: ContactCardProps) {
  const { lng, propertyId, title, contactName, contactPhone, contactWhatsapp, ownerType, owner, trackable = true, ownerId } = props
  const { profile, openSignIn } = useAuth()
  const { openForListing, openInbox } = useChat()
  const isMine = !!profile && !!ownerId && profile.id === ownerId
  const [revealed, setRevealed] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)

  // One view per listing per browser session
  useEffect(() => {
    if (!trackable) return
    rememberViewed(propertyId)
    try {
      const key = `viewed:${propertyId}`
      if (sessionStorage.getItem(key)) return
      sessionStorage.setItem(key, "1")
    } catch {
      // storage unavailable: still count
    }
    trackListingEvent(propertyId, "view")
  }, [propertyId, trackable])

  const phone = normalizeEgyptPhone(contactPhone) || contactPhone
  const isBroker = (owner?.account_type || ownerType) === "broker"
  const displayName = (isBroker && owner?.office_name) || owner?.full_name || contactName || tr(lng, "صاحب الإعلان", "Advertiser")
  const memberSince = owner?.created_at ? new Date(owner.created_at).getFullYear() : null

  const quickQuestions =
    lng === "ar"
      ? ["هل ما زال متاحاً؟", "ممكن أعاين العقار؟", "هل السعر قابل للتفاوض؟"]
      : ["Is it still available?", "Can I view it?", "Is the price negotiable?"]

  const startChat = (text?: string) => {
    if (!trackable) {
      toast.info(tr(lng, "هذه معاينة. المراسلة تعمل بعد نشر الإعلان.", "This is a preview. Messaging works once the listing is live."))
      return
    }
    openForListing(propertyId, title, text)
  }

  const telHref = phone ? `tel:${phone}` : null

  const track = (kind: "call" | "phone_reveal") => {
    if (trackable) trackListingEvent(propertyId, kind)
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{isBroker ? tr(lng, "تواصل مع الوسيط", "Contact the broker") : tr(lng, "تواصل مع المالك", "Contact the owner")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center shrink-0">
            <User className="w-6 h-6 text-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-semibold truncate flex items-center gap-1">
              {displayName}
              {isBroker && owner?.is_verified_broker && <BadgeCheck className="w-4 h-4 text-green-600 shrink-0" aria-label={tr(lng, "وسيط موثّق", "Verified broker")} />}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">{isBroker ? tr(lng, "وسيط", "Broker") : tr(lng, "مالك", "Owner")}</Badge>
              {memberSince && <span>{tr(lng, `عضو منذ ${memberSince}`, `Member since ${memberSince}`)}</span>}
            </div>
          </div>
        </div>

        {isMine ? (
          <>
            <Button size="lg" className="w-full" onClick={openInbox}>
              <MessagesSquare className="w-5 h-5 me-2" />
              {tr(lng, "رسائل المهتمين بإعلانك", "Messages about your listing")}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              {tr(lng, "هذا ما يراه المشترون: زر المراسلة داخل عقار وزر إظهار رقمك.", "This is what buyers see: a message button and a button to show your number.")}
            </p>
          </>
        ) : (
          <>
            <Button size="lg" className="w-full" onClick={() => startChat()}>
              <MessagesSquare className="w-5 h-5 me-2" />
              {tr(lng, "راسل المعلن", "Message the advertiser")}
            </Button>
            <div className="flex flex-wrap gap-2 justify-center">
              {quickQuestions.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => startChat(q)}
                  className="text-xs rounded-full border px-3 py-1.5 hover:border-primary hover:bg-primary/5"
                >
                  {q}
                </button>
              ))}
            </div>
          </>
        )}

        {telHref &&
          (revealed ? (
            <Button asChild size="lg" variant="outline" className="w-full">
              <a href={telHref} onClick={() => track("call")} dir="ltr">
                <Phone className="w-5 h-5 me-2" />
                {formatEgyptPhone(phone)}
              </a>
            </Button>
          ) : (
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => {
                setRevealed(true)
                track("phone_reveal")
              }}
            >
              <Phone className="w-5 h-5 me-2" />
              {tr(lng, "إظهار رقم الهاتف", "Show phone number")}
            </Button>
          ))}

        <p className="text-xs text-muted-foreground text-center">
          {tr(lng, "قل إنك وجدت الإعلان على عقار. لا تحوّل أي أموال قبل معاينة العقار.", "Mention you found this on Aqar. Never send money before viewing the property.")}
        </p>

        <button
          type="button"
          onClick={() => setReportOpen(true)}
          className="w-full text-xs text-muted-foreground hover:text-destructive flex items-center justify-center gap-1 pt-1"
        >
          <Flag className="w-3 h-3" />
          {tr(lng, "إبلاغ عن الإعلان", "Report this listing")}
        </button>
        <ReportListingDialog lng={lng} propertyId={propertyId} open={reportOpen} onOpenChange={setReportOpen} />
      </CardContent>
    </Card>
  )
}
