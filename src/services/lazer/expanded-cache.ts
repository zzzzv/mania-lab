import { api } from '@/api'
import type { LazerBeatmap as LazerBeatmapRaw } from '@/api/lazer-types'

// Fields excluded from expansion for the single-beatmap request.
// BeatmapInfo is the back-reference from ScoreInfo → BeatmapInfo, skip to avoid cycles.
const NO_EXPAND = ['UserSettings', 'HitEvents', 'Pauses']

const cache = new Map<string, Promise<LazerBeatmapRaw | null>>()

/**
 * Fetch a single beatmap by MD5 hash with full expansion (depth 4).
 * Results are cached so concurrent or repeated calls share the same request.
 */
export function getExpandedBeatmap(md5Hash: string): Promise<LazerBeatmapRaw | null> {
  let p = cache.get(md5Hash)
  if (!p) {
    p = doFetch(md5Hash)
    cache.set(md5Hash, p)
  }
  return p
}

async function doFetch(md5Hash: string): Promise<LazerBeatmapRaw | null> {
  try {
    const res = await api.getLazerBeatmaps(
      `MD5Hash=="${md5Hash}"`,
      4,
      NO_EXPAND,
    )
    return res.items[0] ?? null
  } catch {
    return null
  }
}
