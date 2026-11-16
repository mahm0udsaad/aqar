import "server-only"
import { query } from "@/lib/db/pool"
import { db } from "@/lib/db"

/**
 * Content-based recommendations, scored in SQL (no external service):
 * same type (category), same purpose (sale/rent), same area or governorate,
 * price and size in the same range, same number of bedrooms. Newest wins ties.
 */

const GOV_OF = `CASE WHEN l.level = 'governorate' THEN l.id ELSE l.parent_id END`

async function loadCards(ids: string[]) {
  if (!ids.length) return []
  const { data } = await db
    .from("properties")
    .select(`*, categories (*), property_images (*)`)
    .in("id", ids)
    .eq("status", "active")
    .eq("moderation_status", "approved")
  const byId = new Map((data || []).map((p: any) => [p.id, p]))
  return ids
    .map((id) => byId.get(id))
    .filter(Boolean)
    .map((p: any) => {
      p.property_images?.sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
      return p
    })
}

/** Listings similar to one property (for its page). */
export async function getSimilarListings(propertyId: string, limit = 4) {
  if (!/^[0-9a-f-]{36}$/i.test(propertyId)) return []
  const res = await query<{ id: string }>(
    `WITH target AS (
       SELECT p.id, p.category_id, p.property_type, p.location_id, p.area, p.price, p.size, p.bedrooms,
              ${GOV_OF} AS gov_id
         FROM properties p LEFT JOIN locations l ON l.id = p.location_id
        WHERE p.id = $1
     )
     SELECT c.id
       FROM properties c
       LEFT JOIN locations l ON l.id = c.location_id
       CROSS JOIN target t
      WHERE c.id <> t.id AND c.status = 'active' AND c.moderation_status = 'approved'
        AND c.property_type = t.property_type
      ORDER BY
        (CASE WHEN c.category_id = t.category_id THEN 3 ELSE 0 END
         + CASE WHEN t.location_id IS NOT NULL AND c.location_id = t.location_id THEN 3 ELSE 0 END
         + CASE WHEN t.gov_id IS NOT NULL AND ${GOV_OF} = t.gov_id THEN 2 ELSE 0 END
         + CASE WHEN c.area IS NOT NULL AND c.area = t.area THEN 2 ELSE 0 END
         + CASE WHEN c.price BETWEEN t.price * 0.75 AND t.price * 1.25 THEN 2
                WHEN c.price BETWEEN t.price * 0.5 AND t.price * 1.5 THEN 1 ELSE 0 END
         + CASE WHEN t.size > 0 AND c.size BETWEEN t.size * 0.75 AND t.size * 1.25 THEN 1 ELSE 0 END
         + CASE WHEN t.bedrooms > 0 AND c.bedrooms = t.bedrooms THEN 1 ELSE 0 END) DESC,
        COALESCE(c.published_at, c.created_at) DESC
      LIMIT $2`,
    [propertyId, Math.min(Math.max(limit, 1), 12)],
  )
  return loadCards(res.rows.map((r) => r.id))
}

/**
 * "Suggested for you": builds a taste profile from listings the visitor viewed or saved
 * (categories, purpose, governorates, areas, typical price) and ranks everything else.
 */
export async function getSuggestedListings(seedIds: string[], limit = 6) {
  const seeds = seedIds.filter((i) => /^[0-9a-f-]{36}$/i.test(i)).slice(0, 30)
  if (!seeds.length) return []
  const res = await query<{ id: string }>(
    `WITH s AS (
       SELECT p.id, p.category_id, p.property_type, p.area, p.price, ${GOV_OF} AS gov_id
         FROM properties p LEFT JOIN locations l ON l.id = p.location_id
        WHERE p.id = ANY($1::uuid[])
     ),
     profile AS (
       SELECT array_agg(DISTINCT category_id) AS cats,
              array_agg(DISTINCT gov_id) FILTER (WHERE gov_id IS NOT NULL) AS govs,
              array_agg(DISTINCT area) FILTER (WHERE area IS NOT NULL) AS areas,
              mode() WITHIN GROUP (ORDER BY property_type) AS ptype,
              percentile_cont(0.5) WITHIN GROUP (ORDER BY price) AS median_price
         FROM s
     )
     SELECT c.id
       FROM properties c
       LEFT JOIN locations l ON l.id = c.location_id
       CROSS JOIN profile pr
      WHERE c.status = 'active' AND c.moderation_status = 'approved' AND NOT (c.id = ANY($1::uuid[]))
        AND pr.cats IS NOT NULL
      ORDER BY
        (CASE WHEN c.property_type = pr.ptype THEN 3 ELSE 0 END
         + CASE WHEN c.category_id = ANY(pr.cats) THEN 3 ELSE 0 END
         + CASE WHEN pr.govs IS NOT NULL AND ${GOV_OF} = ANY(pr.govs) THEN 2 ELSE 0 END
         + CASE WHEN pr.areas IS NOT NULL AND c.area = ANY(pr.areas) THEN 2 ELSE 0 END
         + CASE WHEN pr.median_price > 0 AND c.price BETWEEN pr.median_price * 0.65 AND pr.median_price * 1.35 THEN 2 ELSE 0 END) DESC,
        COALESCE(c.published_at, c.created_at) DESC
      LIMIT $2`,
    [seeds, Math.min(Math.max(limit, 1), 12)],
  )
  return loadCards(res.rows.map((r) => r.id))
}
