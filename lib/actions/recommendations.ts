"use server"

import { getSuggestedListings } from "@/lib/recommendations"
import { getMyFavoriteIds } from "@/lib/actions/favorites"

/** Public: suggestions from recently viewed ids (sent by the browser) plus the account's favorites. */
export async function fetchSuggestions(recentlyViewed: string[]) {
  const viewed = (Array.isArray(recentlyViewed) ? recentlyViewed : []).filter((i) => typeof i === "string").slice(0, 20)
  const favorites = await getMyFavoriteIds()
  const seeds = Array.from(new Set([...favorites, ...viewed]))
  return getSuggestedListings(seeds, 6)
}
