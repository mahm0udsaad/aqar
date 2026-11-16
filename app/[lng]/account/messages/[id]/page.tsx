import { notFound, redirect } from "next/navigation"
import { Navbar } from "@/components/navbar"
import { ChatThread } from "@/components/chat/chat-thread"
import { getDictionary } from "@/lib/i18n/get-dictionary"
import type { Locale } from "@/lib/i18n/config"
import { getConversation, getConversationHeader } from "@/lib/actions/chat"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"
export const metadata = { robots: { index: false } }

export default async function ConversationPage({ params }: { params: Promise<{ lng: Locale; id: string }> }) {
  const { lng, id } = await params
  const user = await getCurrentUser()
  if (!user) redirect(`/${lng}/auth/login?redirectTo=${encodeURIComponent(`${process.env.NEXT_PUBLIC_BASE_PATH || ""}/${lng}/account/messages/${id}`)}`)
  const [header, convo] = await Promise.all([getConversationHeader(id), getConversation(id)])
  if (!header || !convo) notFound()
  const dict = await getDictionary(lng)

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar lng={lng} dict={dict} />
      <main className="max-w-3xl mx-auto px-0 sm:px-4 py-0 sm:py-6">
        <ChatThread lng={lng} conversationId={id} me={convo.me} header={header} initialMessages={convo.messages} />
      </main>
    </div>
  )
}
