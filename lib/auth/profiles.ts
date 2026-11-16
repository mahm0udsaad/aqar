import "server-only"
import { query } from "@/lib/db/pool"

export type UserRole = "user" | "admin"
export type AccountType = "owner" | "broker"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  whatsapp: string | null
  role: UserRole
  account_type: AccountType | null
  office_name: string | null
  license_number: string | null
  is_verified_broker: boolean
  plan_id: string | null
  is_suspended: boolean
  onboarded_at: string | null
  created_at: string | null
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

const COLUMNS = `id, email, full_name, avatar_url, phone, whatsapp, role, account_type, office_name, license_number,
  is_verified_broker, plan_id, is_suspended, onboarded_at, created_at`

/**
 * Find or create the user_profiles row for a signed-in email.
 * Roles are only ever granted here (from ADMIN_EMAILS) or by an admin in the database,
 * never from anything the client sends.
 */
export async function upsertProfileForSignIn(input: {
  email: string
  name: string | null
  image: string | null
}): Promise<UserProfile> {
  const email = input.email.trim().toLowerCase()
  const makeAdmin = adminEmails().has(email)

  const existing = await query<UserProfile>(
    `SELECT ${COLUMNS} FROM user_profiles WHERE lower(email) = $1 ORDER BY created_at ASC LIMIT 1`,
    [email],
  )

  if (existing.rows[0]) {
    const row = existing.rows[0]
    const updated = await query<UserProfile>(
      `UPDATE user_profiles
          SET full_name = COALESCE(full_name, $2),
              avatar_url = COALESCE(avatar_url, $3),
              role = CASE WHEN $4::boolean THEN 'admin' ELSE COALESCE(role, 'user') END,
              updated_at = now()
        WHERE id = $1
        RETURNING ${COLUMNS}`,
      [row.id, input.name, input.image, makeAdmin],
    )
    return normalize(updated.rows[0])
  }

  const inserted = await query<UserProfile>(
    `INSERT INTO user_profiles (id, email, full_name, avatar_url, role, created_at, updated_at)
     VALUES (gen_random_uuid(), $1, $2, $3, $4, now(), now())
     RETURNING ${COLUMNS}`,
    [email, input.name, input.image, makeAdmin ? "admin" : "user"],
  )
  return normalize(inserted.rows[0])
}

export async function getProfileById(id: string): Promise<UserProfile | null> {
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null
  const res = await query<UserProfile>(`SELECT ${COLUMNS} FROM user_profiles WHERE id = $1`, [id])
  return res.rows[0] ? normalize(res.rows[0]) : null
}

/** Setup is complete once the user picked owner/broker and gave a phone number. */
export function needsOnboarding(p: Pick<UserProfile, "account_type" | "phone">) {
  return !p.account_type || !p.phone
}

/** How many listings this account may have live or in review at once. */
export async function getListingLimit(p: UserProfile): Promise<number> {
  const planId = p.plan_id || (p.account_type === "broker" ? "free_broker" : "free_owner")
  const res = await query<{ listing_limit: number }>(`SELECT listing_limit FROM plans WHERE id = $1`, [planId])
  return res.rows[0]?.listing_limit ?? (p.account_type === "broker" ? 30 : 5)
}

/** Listings that count against the limit: live, paused or waiting for review (not sold, rented or rejected). */
export async function countActiveListings(userId: string): Promise<number> {
  const res = await query<{ n: number }>(
    `SELECT count(*)::int AS n FROM properties
      WHERE owner_id = $1 AND status IN ('active', 'inactive') AND moderation_status <> 'rejected'`,
    [userId],
  )
  return res.rows[0]?.n ?? 0
}

function normalize(p: UserProfile): UserProfile {
  return {
    ...p,
    role: p.role === "admin" ? "admin" : "user",
    account_type: p.account_type === "broker" ? "broker" : p.account_type === "owner" ? "owner" : null,
  }
}
