import { api } from '@/api'
import type { Beatmap } from '@/models'
import { timed } from '@/services/timing'
import { applyQuery } from '@/components/search/pipeline'
import { LazerBeatmap } from './beatmap'
import { buildRql } from './rql'
import { getCachedBeatmaps, updateCache } from './cache'
import type { QueryState } from '@/components/search/types'

// Fields to skip expanding when querying beatmaps.
const NO_EXPAND = ['BeatmapSet', 'UserSettings', 'File', 'HitEvents', 'Pauses']

/**
 * Query lazer beatmaps using basic filter settings.
 *
 * When `useCache` is true, filters from the local cache instead of API.
 * Cache is populated incrementally by prior non-cached queries.
 */
export async function queryLazerBeatmaps(filter: QueryState, useCache = false): Promise<Beatmap[]> {
  return timed('queryLazerBeatmaps', 100, async () => {
    // Cache hit: apply basic filter locally
    if (useCache) {
      const cached = getCachedBeatmaps()
      if (cached.length > 0) {
        return applyQuery(cached, filter)
      }
    }

    // API query, then update cache
    const rql = buildRql(filter)
    const res = await api.getLazerBeatmaps(rql, 3, NO_EXPAND)
    const items = res.items.map(item => new LazerBeatmap(item))
    updateCache(items)
    return items
  })
}
