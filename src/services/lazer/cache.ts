import { ref } from 'vue'
import type { LazerBeatmap } from './beatmap'

// Incremental cache: accumulates beatmaps across queries, keyed by md5Hash.
const _cache = new Map<string, LazerBeatmap>()
const _version = ref(0)

/** All cached lazer beatmaps. */
export function getCachedBeatmaps(): LazerBeatmap[] {
  _version.value // track reactivity
  return [..._cache.values()]
}

/** Number of cached beatmaps (reactive). */
export function cachedCount(): number {
  _version.value // track reactivity
  return _cache.size
}

/** Merge new items into the cache (upsert by md5Hash). */
export function updateCache(items: LazerBeatmap[]): void {
  for (const item of items) {
    _cache.set(item.md5Hash, item)
  }
  _version.value++
}

/** Clear the cache (e.g. when refreshing all data). */
export function clearCache(): void {
  _cache.clear()
  _version.value++
}
