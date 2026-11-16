import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { needsOnboarding } from "@/lib/auth/profiles"
import { getMyUnreadCount } from "@/lib/actions/chat"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  const unread = user ? await getMyUnreadCount() : 0
  return NextResponse.json(
    {
      user: user
        ? {
            id: user.id,
            email: user.email,
            full_name: user.full_name,
            avatar_url: user.avatar_url,
            phone: user.phone,
            whatsapp: user.whatsapp,
            role: user.role,
            account_type: user.account_type,
            office_name: user.office_name,
            is_suspended: user.is_suspended,
            needs_onboarding: needsOnboarding(user),
            unread_messages: unread,
          }
        : null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
