"use server"

import { query } from "@/lib/db/pool"
import { getCurrentUser } from "@/lib/auth/session"
import { tr } from "@/lib/listing-options"

const UUID = /^[0-9a-f-]{36}$/i
type Fail = { success: false; message: string; code?: string }

export interface ChatMessage {
  id: number
  sender_id: string
  body: string
  created_at: string
}

export interface ConversationSummary {
  id: string
  property_id: string
  property_title: string
  property_thumb: string | null
  property_price: number
  property_type: string
  other_name: string
  i_am: "buyer" | "owner"
  last_message: string | null
  last_message_at: string
  unread: boolean
}

function cleanBody(body: unknown) {
  return typeof body === "string" ? body.replace(/\r\n/g, "\n").trim().slice(0, 2000) : ""
}

/** Very small flood guard: at most 20 messages per user per minute. */
async function tooManyMessages(userId: string) {
  const r = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM messages WHERE sender_id = $1 AND created_at > now() - interval '1 minute'`,
    [userId],
  )
  return (r.rows[0]?.n ?? 0) >= 20
}

/** Buyer starts (or continues) a conversation about a listing. */
export async function startConversation(propertyId: string, body: string, lng = "ar"): Promise<{ success: true; id: string } | Fail> {
  const user = await getCurrentUser()
  if (!user) return { success: false, code: "AUTH", message: tr(lng, "سجّل الدخول لترسل رسالة", "Sign in to send a message") }
  if (user.is_suspended) return { success: false, message: tr(lng, "حسابك موقوف", "Your account is suspended") }
  if (!UUID.test(propertyId)) return { success: false, message: "Invalid listing" }
  const text = cleanBody(body)
  if (!text) return { success: false, message: tr(lng, "اكتب رسالتك", "Write your message") }

  const p = await query<{ owner_id: string | null }>(
    `SELECT owner_id FROM properties WHERE id = $1 AND status = 'active' AND moderation_status = 'approved'`,
    [propertyId],
  )
  const ownerId = p.rows[0]?.owner_id
  if (!ownerId) return { success: false, message: tr(lng, "المراسلة غير متاحة لهذا الإعلان", "Messaging isn't available for this listing") }
  if (ownerId === user.id) return { success: false, message: tr(lng, "هذا إعلانك", "This is your own listing") }
  if (await tooManyMessages(user.id)) return { success: false, message: tr(lng, "أرسلت رسائل كثيرة، انتظر دقيقة", "Too many messages, wait a minute") }

  const conv = await query<{ id: string; created: boolean }>(
    `INSERT INTO conversations (property_id, buyer_id, owner_id) VALUES ($1, $2, $3)
     ON CONFLICT (property_id, buyer_id) DO UPDATE SET last_message_at = now()
     RETURNING id, (xmax = 0) AS created`,
    [propertyId, user.id, ownerId],
  )
  const { id, created } = conv.rows[0]
  await query(`INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3)`, [id, user.id, text])
  await query(`UPDATE conversations SET last_message_at = now(), buyer_last_read_at = now() WHERE id = $1`, [id])
  if (created) await query(`INSERT INTO listing_events (property_id, kind) VALUES ($1, 'message')`, [propertyId]).catch(() => {})
  return { success: true, id }
}

async function participant(conversationId: string, userId: string) {
  if (!UUID.test(conversationId)) return null
  const r = await query<{ buyer_id: string; owner_id: string; property_id: string }>(
    `SELECT buyer_id, owner_id, property_id FROM conversations WHERE id = $1 AND (buyer_id = $2 OR owner_id = $2)`,
    [conversationId, userId],
  )
  return r.rows[0] || null
}

export async function sendMessage(conversationId: string, body: string, lng = "ar"): Promise<{ success: true; message: ChatMessage } | Fail> {
  const user = await getCurrentUser()
  if (!user) return { success: false, code: "AUTH", message: tr(lng, "سجّل الدخول", "Please sign in") }
  if (user.is_suspended) return { success: false, message: tr(lng, "حسابك موقوف", "Your account is suspended") }
  const conv = await participant(conversationId, user.id)
  if (!conv) return { success: false, message: tr(lng, "المحادثة غير موجودة", "Conversation not found") }
  const text = cleanBody(body)
  if (!text) return { success: false, message: tr(lng, "اكتب رسالتك", "Write your message") }
  if (await tooManyMessages(user.id)) return { success: false, message: tr(lng, "أرسلت رسائل كثيرة، انتظر دقيقة", "Too many messages, wait a minute") }

  const m = await query<ChatMessage>(
    `INSERT INTO messages (conversation_id, sender_id, body) VALUES ($1, $2, $3) RETURNING id, sender_id, body, created_at`,
    [conversationId, user.id, text],
  )
  const readCol = conv.buyer_id === user.id ? "buyer_last_read_at" : "owner_last_read_at"
  await query(`UPDATE conversations SET last_message_at = now(), ${readCol} = now() WHERE id = $1`, [conversationId])
  return { success: true, message: m.rows[0] }
}

/** Messages of one conversation (optionally only newer than `afterId`); marks it read. */
export async function getConversation(conversationId: string, afterId = 0) {
  const user = await getCurrentUser()
  if (!user) return null
  const conv = await participant(conversationId, user.id)
  if (!conv) return null
  const msgs = await query<ChatMessage>(
    `SELECT id, sender_id, body, created_at FROM (
        SELECT id, sender_id, body, created_at FROM messages
         WHERE conversation_id = $1 AND id > $2 ORDER BY id DESC LIMIT 300
      ) m ORDER BY id ASC`,
    [conversationId, Number(afterId) || 0],
  )
  const readCol = conv.buyer_id === user.id ? "buyer_last_read_at" : "owner_last_read_at"
  await query(`UPDATE conversations SET ${readCol} = now() WHERE id = $1`, [conversationId])
  return { me: user.id, messages: msgs.rows }
}

export async function getConversationHeader(conversationId: string) {
  const user = await getCurrentUser()
  if (!user) return null
  const r = await query<any>(
    `SELECT c.id, c.property_id, c.buyer_id, c.owner_id,
            COALESCE(p.title_ar, p.title_en, p.title) AS property_title, p.thumbnail_url AS property_thumb, p.price AS property_price,
            p.property_type::text AS property_type, p.status::text AS property_status, p.moderation_status,
            CASE WHEN c.buyer_id = $2 THEN COALESCE(NULLIF(o.office_name, ''), o.full_name, 'المعلن') ELSE COALESCE(b.full_name, 'مشتري') END AS other_name,
            CASE WHEN c.buyer_id = $2 THEN 'buyer' ELSE 'owner' END AS i_am
       FROM conversations c
       JOIN properties p ON p.id = c.property_id
       JOIN user_profiles o ON o.id = c.owner_id
       JOIN user_profiles b ON b.id = c.buyer_id
      WHERE c.id = $1 AND (c.buyer_id = $2 OR c.owner_id = $2)`,
    [UUID.test(conversationId) ? conversationId : "00000000-0000-0000-0000-000000000000", user.id],
  )
  return r.rows[0] || null
}

export async function getInbox(): Promise<ConversationSummary[] | null> {
  const user = await getCurrentUser()
  if (!user) return null
  const r = await query<ConversationSummary>(
    `SELECT c.id, c.property_id,
            COALESCE(p.title_ar, p.title_en, p.title) AS property_title, p.thumbnail_url AS property_thumb,
            p.price AS property_price, p.property_type::text AS property_type,
            CASE WHEN c.buyer_id = $1 THEN COALESCE(NULLIF(o.office_name, ''), o.full_name, 'المعلن') ELSE COALESCE(b.full_name, 'مشتري') END AS other_name,
            CASE WHEN c.buyer_id = $1 THEN 'buyer' ELSE 'owner' END AS i_am,
            (SELECT m.body FROM messages m WHERE m.conversation_id = c.id ORDER BY m.id DESC LIMIT 1) AS last_message,
            c.last_message_at,
            EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> $1
                      AND m.created_at > CASE WHEN c.buyer_id = $1 THEN c.buyer_last_read_at ELSE c.owner_last_read_at END) AS unread
       FROM conversations c
       JOIN properties p ON p.id = c.property_id
       JOIN user_profiles o ON o.id = c.owner_id
       JOIN user_profiles b ON b.id = c.buyer_id
      WHERE c.buyer_id = $1 OR c.owner_id = $1
      ORDER BY c.last_message_at DESC
      LIMIT 200`,
    [user.id],
  )
  return r.rows
}

/** Number of the signed-in user's conversations with unread messages. */
export async function getMyUnreadCount(): Promise<number> {
  const user = await getCurrentUser()
  if (!user) return 0
  const userId = user.id
  const r = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM conversations c
      WHERE (c.buyer_id = $1 OR c.owner_id = $1)
        AND EXISTS (SELECT 1 FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> $1
                      AND m.created_at > CASE WHEN c.buyer_id = $1 THEN c.buyer_last_read_at ELSE c.owner_last_read_at END)`,
    [userId],
  )
  return r.rows[0]?.n ?? 0
}
