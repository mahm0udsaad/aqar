import "server-only"
import { cache } from "react"
import { auth } from "@/auth"
import { getProfileById, type UserProfile } from "./profiles"

/**
 * The signed-in user's profile, read fresh from the database on every request
 * (so a role change or deleted account takes effect immediately).
 */
export const getCurrentUser = cache(async (): Promise<UserProfile | null> => {
  const session = await auth()
  const id = (session?.user as any)?.id as string | undefined
  if (!id) return null
  return getProfileById(id)
})

/** Returns the admin's profile, or null when the caller is not a signed-in admin. */
export async function getAdminUser(): Promise<UserProfile | null> {
  const user = await getCurrentUser()
  return user?.role === "admin" ? user : null
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized") {
    super(message)
    this.name = "UnauthorizedError"
  }
}

/** Throws unless the caller is a signed-in admin. */
export async function requireAdmin(): Promise<UserProfile> {
  const admin = await getAdminUser()
  if (!admin) throw new UnauthorizedError()
  return admin
}
