import { createClient } from "@supabase/supabase-js"
import type { Database } from "./types"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

console.log("Supabase URL:", supabaseUrl ? "Set" : "Missing")
console.log("Supabase Key:", supabaseAnonKey ? "Set" : "Missing")

if (!supabaseUrl) {
  console.error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_URL")
}

if (!supabaseAnonKey) {
  console.error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
  throw new Error("Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY")
}

// Validate URL format
try {
  new URL(supabaseUrl)
} catch (error) {
  console.error("Invalid NEXT_PUBLIC_SUPABASE_URL format:", error)
  throw new Error("Invalid NEXT_PUBLIC_SUPABASE_URL format")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
})

// Test the connection
supabase.from("properties").select("count", { count: "exact", head: true }).then(({ error }) => {
  if (error) {
    console.error("Supabase connection test failed:", error)
  } else {
    console.log("Supabase connection successful")
  }
})
