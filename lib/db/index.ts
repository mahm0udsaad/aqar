import "server-only"
import { from, rpc } from "./query-builder"
import { storage } from "./storage"

export { escapeLike } from "./query-builder"
export type { DbResult, DbError } from "./query-builder"

/**
 * Server-side database client with the same surface the code used from supabase-js
 * (`from`, `rpc`, `storage`). There is no `auth` here on purpose: use lib/auth/session.ts.
 */
export const db = { from, rpc, storage }

export function createDb() {
  return db
}

export type Db = typeof db
