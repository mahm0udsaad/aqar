import "server-only"
import { query } from "@/lib/db/pool"

export type UserRole = "user" | "admin"

export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  phone: string | null
  role: UserRole
}

function adminEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
}

const COLUMNS = "id, email, full_name, avatar_url, phone, role"

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

function normalize(p: UserProfile): UserProfile {
  return { ...p, role: p.role === "admin" ? "admin" : "user" }
}
