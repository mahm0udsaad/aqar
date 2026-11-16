import "server-only"
import { Pool, types } from "pg"

// Return Postgres types in the same shape PostgREST (Supabase) used to,
// so existing UI code keeps working: numerics as numbers, timestamps as ISO strings.
const parseTimestamp = types.getTypeParser(1184)
types.setTypeParser(1700, (v) => (v === null ? null : parseFloat(v))) // numeric
types.setTypeParser(20, (v) => (v === null ? null : parseInt(v, 10))) // int8 / count(*)
types.setTypeParser(1184, (v) => (v === null ? null : new Date(parseTimestamp(v) as any).toISOString())) // timestamptz
types.setTypeParser(1114, (v) => v) // timestamp without tz: keep raw
types.setTypeParser(1082, (v) => v) // date: keep raw

declare global {
  // eslint-disable-next-line no-var
  var __aqarPgPool: Pool | undefined
}

function createPool() {
  const connectionString = process.env.DATABASE_URL
  return new Pool(
    connectionString
      ? { connectionString, max: 5 }
      : {
          host: process.env.PGHOST || "127.0.0.1",
          port: parseInt(process.env.PGPORT || "5432", 10),
          user: process.env.PGUSER,
          password: process.env.PGPASSWORD,
          database: process.env.PGDATABASE,
          max: 5,
        },
  )
}

export const pool: Pool = globalThis.__aqarPgPool ?? createPool()
if (process.env.NODE_ENV !== "production") globalThis.__aqarPgPool = pool

export async function query<T = any>(text: string, params: unknown[] = []) {
  return pool.query<T & Record<string, any>>(text, params as any[])
}
