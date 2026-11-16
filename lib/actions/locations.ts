"use server"

import { query } from "@/lib/db/pool"

export interface LocationOption {
  id: string
  name_ar: string
  name_en: string
  slug: string
  level: string
}

/** Public, read-only: governorates (no parent) or the children of one location. */
export async function getLocations(parentId?: string | null): Promise<LocationOption[]> {
  if (parentId && !/^[0-9a-f-]{36}$/i.test(parentId)) return []
  const res = parentId
    ? await query<LocationOption>(
        `SELECT id, name_ar, name_en, slug, level FROM locations
          WHERE parent_id = $1 AND is_active ORDER BY sort_order, name_ar`,
        [parentId],
      )
    : await query<LocationOption>(
        `SELECT id, name_ar, name_en, slug, level FROM locations
          WHERE parent_id IS NULL AND is_active ORDER BY sort_order, name_ar`,
      )
  return res.rows
}
