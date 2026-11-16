"use server"

import { query } from "@/lib/db/pool"
import { getCurrentUser } from "@/lib/auth/session"

const UUID = /^[0-9a-f-]{36}$/i

export interface ListingAnalytics {
  id: string
  title: string
  price: number
  size: number
  area: string | null
  property_type: string
  status: string
  moderation_status: string
  published_at: string | null
  totals: { views: number; whatsapp: number; calls: number; favorites: number; conversations: number; shares: number }
  last30: { views: number; contacts: number; favorites: number; conversations: number }
  daily: { date: string; views: number; contacts: number }[]
  market: { ppm: number; medianPpm: number | null; comparables: number; diffPct: number | null }
}

/** Stats for one listing: the owner or an admin only. */
export async function getListingAnalytics(id: string, days = 30): Promise<ListingAnalytics | null> {
  const user = await getCurrentUser()
  if (!user || !UUID.test(id)) return null
  const span = Math.min(Math.max(Math.floor(days) || 30, 7), 90)

  const p = await query<any>(
    `SELECT id, COALESCE(title_ar, title_en, title) AS title, price, size, area, property_type::text, status::text,
            moderation_status, published_at, owner_id, category_id, location_id,
            COALESCE(views, 0) AS views, whatsapp_clicks, call_clicks
       FROM properties WHERE id = $1`,
    [id],
  )
  const row = p.rows[0]
  if (!row || (row.owner_id !== user.id && user.role !== "admin")) return null

  const [counts, last30, daily, market] = await Promise.all([
    query<any>(
      `SELECT (SELECT count(*)::int FROM loved_properties WHERE property_id = $1) AS favorites,
              (SELECT count(*)::int FROM conversations WHERE property_id = $1) AS conversations,
              (SELECT count(*)::int FROM listing_events WHERE property_id = $1 AND kind = 'share') AS shares`,
      [id],
    ),
    query<any>(
      `SELECT count(*) FILTER (WHERE kind = 'view')::int AS views,
              count(*) FILTER (WHERE kind IN ('whatsapp', 'call', 'phone_reveal', 'message'))::int AS contacts,
              count(*) FILTER (WHERE kind = 'favorite')::int AS favorites,
              count(*) FILTER (WHERE kind = 'message')::int AS conversations
         FROM listing_events WHERE property_id = $1 AND created_at > now() - interval '30 days'`,
      [id],
    ),
    query<any>(
      `SELECT to_char(d.day, 'YYYY-MM-DD') AS date,
              COALESCE(sum(CASE WHEN e.kind = 'view' THEN 1 ELSE 0 END), 0)::int AS views,
              COALESCE(sum(CASE WHEN e.kind IN ('whatsapp', 'call', 'phone_reveal', 'message') THEN 1 ELSE 0 END), 0)::int AS contacts
         FROM generate_series(
                date_trunc('day', now() AT TIME ZONE 'Africa/Cairo') - ($2::int - 1) * interval '1 day',
                date_trunc('day', now() AT TIME ZONE 'Africa/Cairo'),
                interval '1 day') AS d(day)
         LEFT JOIN listing_events e
           ON e.property_id = $1 AND date_trunc('day', e.created_at AT TIME ZONE 'Africa/Cairo') = d.day
        GROUP BY d.day ORDER BY d.day`,
      [id, span],
    ),
    // price per m² against approved listings of the same type and purpose in the same area
    query<any>(
      `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY s.price / s.size) AS median_ppm, count(*)::int AS n
         FROM properties s
        WHERE s.moderation_status = 'approved' AND s.status IN ('active', 'sold', 'rented') AND s.size > 0
          AND s.id <> $1 AND s.category_id = $2 AND s.property_type::text = $3
          AND (s.location_id = $4 OR (s.area IS NOT NULL AND s.area = $5))`,
      [id, row.category_id, row.property_type, row.location_id, row.area],
    ),
  ])

  const ppm = row.size > 0 ? Math.round(row.price / row.size) : 0
  const median = market.rows[0]?.median_ppm ? Math.round(market.rows[0].median_ppm) : null
  const comparables = market.rows[0]?.n ?? 0
  return {
    id: row.id,
    title: row.title,
    price: row.price,
    size: row.size,
    area: row.area,
    property_type: row.property_type,
    status: row.status,
    moderation_status: row.moderation_status,
    published_at: row.published_at,
    totals: {
      views: row.views,
      whatsapp: row.whatsapp_clicks,
      calls: row.call_clicks,
      favorites: counts.rows[0].favorites,
      conversations: counts.rows[0].conversations,
      shares: counts.rows[0].shares,
    },
    last30: last30.rows[0],
    daily: daily.rows,
    market: {
      ppm,
      medianPpm: comparables >= 3 ? median : null,
      comparables,
      diffPct: comparables >= 3 && median ? Math.round(((ppm - median) / median) * 100) : null,
    },
  }
}

/** Last-30-day totals across all of the signed-in user's listings. */
export async function getMyAnalyticsOverview() {
  const user = await getCurrentUser()
  if (!user) return null
  const r = await query<any>(
    `SELECT count(*) FILTER (WHERE e.kind = 'view')::int AS views,
            count(*) FILTER (WHERE e.kind IN ('whatsapp', 'call', 'phone_reveal', 'message'))::int AS contacts,
            count(*) FILTER (WHERE e.kind = 'favorite')::int AS favorites,
            count(*) FILTER (WHERE e.kind = 'message')::int AS conversations
       FROM listing_events e JOIN properties p ON p.id = e.property_id
      WHERE p.owner_id = $1 AND e.created_at > now() - interval '30 days'`,
    [user.id],
  )
  return r.rows[0] as { views: number; contacts: number; favorites: number; conversations: number }
}
