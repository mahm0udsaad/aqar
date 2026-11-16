import { NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"

export const dynamic = "force-dynamic"

export async function GET() {
  const user = await getCurrentUser()
  return NextResponse.json(
    { user: user ? { id: user.id, email: user.email, full_name: user.full_name, avatar_url: user.avatar_url, role: user.role } : null },
    { headers: { "Cache-Control": "private, no-store" } },
  )
}
