"use server"

import { query } from "@/lib/db/pool"
import { getCurrentUser } from "@/lib/auth/session"

const UUID = /^[0-9a-f-]{36}$/i

/** Ids of the signed-in user's favorites ([] for visitors). */
export async function getMyFavoriteIds(): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const res = await query<{ property_id: string }>(`SELECT property_id FROM loved_properties WHERE user_id = $1`, [user.id])
  return res.rows.map((r) => r.property_id)
}

/** Adds or removes a favorite. Returns the new state, or null when not signed in. */
export async function toggleFavorite(propertyId: string): Promise<{ favorite: boolean } | null> {
  const user = await getCurrentUser()
  if (!user || !UUID.test(propertyId)) return null
  const removed = await query(`DELETE FROM loved_properties WHERE user_id = $1 AND property_id = $2 RETURNING id`, [user.id, propertyId])
  if (removed.rows.length) return { favorite: false }

  const inserted = await query(
    `INSERT INTO loved_properties (user_id, property_id)
     SELECT $1, id FROM properties WHERE id = $2 AND status = 'active' AND moderation_status = 'approved'
     ON CONFLICT (user_id, property_id) DO NOTHING RETURNING id`,
    [user.id, propertyId],
  )
  if (inserted.rows.length) {
    await query(`INSERT INTO listing_events (property_id, kind) VALUES ($1, 'favorite')`, [propertyId]).catch(() => {})
  }
  return { favorite: true }
}

/** Moves favorites saved in the browser before signing in into the account. */
export async function mergeFavorites(ids: string[]): Promise<string[]> {
  const user = await getCurrentUser()
  if (!user) return []
  const clean = (Array.isArray(ids) ? ids : []).filter((i) => typeof i === "string" && UUID.test(i)).slice(0, 100)
  if (clean.length) {
    await query(
      `INSERT INTO loved_properties (user_id, property_id)
       SELECT $1, p.id FROM properties p WHERE p.id = ANY($2::uuid[]) AND p.status = 'active' AND p.moderation_status = 'approved'
       ON CONFLICT (user_id, property_id) DO NOTHING`,
      [user.id, clean],
    )
  }
  return getMyFavoriteIds()
}
