"use client"

import { useEffect, useState } from "react"
import { BadgeCheck, Flag, MessageCircle, Phone, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { trackListingEvent } from "@/lib/actions/listings"
import { formatEgyptPhone, normalizeEgyptPhone, tr, whatsappDigits } from "@/lib/listing-options"
import { ReportListingDialog } from "./report-listing-dialog"
import { rememberViewed } from "./suggested-for-you"
import { MessageOwnerDialog } from "./message-owner-dialog"
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
  const [messageOpen, setMessageOpen] = useState(false)
  const isMine = !!profile && !!ownerId && profile.id === ownerId
  const [revealed, setRevealed] = useState(false)
  const [reportOpen, setReportOpen] = useState(false)
  const [pageUrl, setPageUrl] = useState("")

  useEffect(() => {
    setPageUrl(window.location.href.split("#")[0])
  }, [])

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
  const whatsapp = normalizeEgyptPhone(contactWhatsapp) || normalizeEgyptPhone(contactPhone)
  const isBroker = (owner?.account_type || ownerType) === "broker"
  const displayName = (isBroker && owner?.office_name) || owner?.full_name || contactName || tr(lng, "صاحب الإعلان", "Advertiser")
  const memberSince = owner?.created_at ? new Date(owner.created_at).getFullYear() : null

  const message = tr(
    lng,
    `مرحباً، أنا مهتم بإعلانك "${title}" على عقار${pageUrl ? `: ${pageUrl}` : ""}`,
    `Hello, I'm interested in your listing "${title}" on Aqar${pageUrl ? `: ${pageUrl}` : ""}`,
  )
  const waHref = whatsapp ? `https://wa.me/${whatsappDigits(whatsapp)}?text=${encodeURIComponent(message)}` : null
  const telHref = phone ? `tel:${phone}` : null

  const track = (kind: "whatsapp" | "call" | "phone_reveal") => {
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

        {waHref && (
          <Button asChild size="lg" className="w-full bg-[#25D366] hover:bg-[#1ebe5b] text-white">
            <a href={waHref} target="_blank" rel="noopener noreferrer" onClick={() => track("whatsapp")}>
              <MessageCircle className="w-5 h-5 me-2" />
              {tr(lng, "تواصل عبر واتساب", "Chat on WhatsApp")}
            </a>
          </Button>
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

        {ownerId && trackable && !isMine && (
          <>
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => (profile ? setMessageOpen(true) : openSignIn())}
            >
              <MessagesSquare className="w-5 h-5 me-2" />
              {tr(lng, "راسل المعلن داخل عقار", "Message on Aqar")}
            </Button>
            <MessageOwnerDialog lng={lng} propertyId={propertyId} open={messageOpen} onOpenChange={setMessageOpen} />
          </>
        )}

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
