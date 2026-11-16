import Link from "next/link"
import { redirect } from "next/navigation"
import { MessagesSquare } from "lucide-react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent } from "@/components/ui/card"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getInbox } from "@/lib/actions/chat"
import { assetUrl } from "@/lib/utils"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

export default async function InboxPage({ params }: { params: Promise<{ lng: Locale }> }) {
  const { lng } = await params
  const inbox = await getInbox()
  if (!inbox) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/messages`)}`)
  const dict = await getDictionary(lng)
  const ar = lng === "ar"
  const when = (d: string) => new Date(d).toLocaleString(ar ? "ar-EG" : "en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-3xl mx-auto px-4 py-8 space-y-4">
        <h1 className="text-2xl md:text-3xl font-bold">{ar ? "الرسائل" : "Messages"}</h1>
        {inbox.length === 0 ? (
          <Card>
            <CardContent className="p-10 text-center text-muted-foreground space-y-3">
              <MessagesSquare className="w-10 h-10 mx-auto" />
              <p>{ar ? "لا توجد محادثات بعد. راسل أي معلن من صفحة الإعلان." : "No conversations yet. Message any advertiser from their listing page."}</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-0 divide-y">
              {inbox.map((c) => (
                <Link key={c.id} href={`/${lng}/account/messages/${c.id}`} className="flex gap-3 p-4 hover:bg-muted/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={assetUrl(c.property_thumb || "/placeholder.svg")} alt="" className="w-16 h-16 rounded-md object-cover bg-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between gap-2">
                      <span className={`truncate ${c.unread ? "font-bold" : "font-medium"}`}>{c.other_name}</span>
                      <span className="text-xs text-muted-foreground shrink-0">{when(c.last_message_at)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.i_am === "owner" ? (ar ? "على إعلانك: " : "About your listing: ") : ""}
                      {c.property_title}
                    </div>
                    <div className={`text-sm truncate ${c.unread ? "text-foreground font-semibold" : "text-muted-foreground"}`}>{c.last_message}</div>
                  </div>
                  {c.unread && <span className="w-2.5 h-2.5 rounded-full bg-primary self-center shrink-0" aria-label={ar ? "غير مقروءة" : "Unread"} />}
                </Link>
              ))}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
