"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createDb } from "@/lib/db"
import { getAdminUser } from "@/lib/auth/session"

export interface HomeHeroInput {
  title_en: string
  title_ar: string
  subtitle_en: string
  subtitle_ar: string
  background_image_url: string
}

const HeroSchema = z.object({
  title_en: z.string().max(300).default(""),
  title_ar: z.string().max(300).default(""),
  subtitle_en: z.string().max(1000).default(""),
  subtitle_ar: z.string().max(1000).default(""),
  background_image_url: z.string().max(1000).default(""),
})

const StatsSchema = z.record(z.string().regex(/^[a-z0-9_]{1,50}$/), z.string().max(100))

export async function getHomeContentForAdmin(): Promise<{ hero: HomeHeroInput | null; stats: Record<string, string> }> {
  if (!(await getAdminUser())) return { hero: null, stats: {} }
  const db = createDb()
  const { data: heroData } = await db.from("home_hero").select("*").order("updated_at", { ascending: false }).limit(1).maybeSingle()
  const { data: statsRows } = await db.from("home_stats").select("key,value")
  const stats: Record<string, string> = {}
  ;(statsRows || []).forEach((r: any) => (stats[r.key] = r.value))
  return {
    hero: heroData
      ? {
          title_en: heroData.title_en || "",
          title_ar: heroData.title_ar || "",
          subtitle_en: heroData.subtitle_en || "",
          subtitle_ar: heroData.subtitle_ar || "",
          background_image_url: heroData.background_image_url || "",
        }
      : null,
    stats,
  }
}

export async function saveHomeContent(hero: HomeHeroInput, stats: Record<string, string>) {
  if (!(await getAdminUser())) return { success: false, message: "Admin access required" }
  const heroParsed = HeroSchema.safeParse(hero)
  const statsParsed = StatsSchema.safeParse(stats)
  if (!heroParsed.success || !statsParsed.success) return { success: false, message: "Invalid content" }

  const db = createDb()
  const { error: heroError } = await db.from("home_hero").insert({
    ...heroParsed.data,
    background_image_url: heroParsed.data.background_image_url || null,
    updated_at: new Date().toISOString(),
  })
  if (heroError) return { success: false, message: heroError.message }

  const rows = Object.entries(statsParsed.data).map(([key, value]) => ({ key, value, updated_at: new Date().toISOString() }))
  if (rows.length) {
    const { error: statsError } = await db.from("home_stats").upsert(rows, { onConflict: "key" })
    if (statsError) return { success: false, message: statsError.message }
  }

  revalidatePath("/", "layout")
  return { success: true }
}
