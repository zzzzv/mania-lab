import type { Beatmap } from '@/models'
import { StableBeatmap } from './beatmap'
import { StableScore } from './score'
import { beatmapEntryCache, scoresBeatmapEntryCache, bgCache } from './cache'
import { timed } from '@/services/timing'

export async function getBeatmaps(useCache: boolean = true): Promise<Beatmap[]> {
  return timed('getBeatmaps', 100, async () => {
    if (!useCache) {
      beatmapEntryCache.reset()
      scoresBeatmapEntryCache.reset()
    }
    await Promise.all([
      beatmapEntryCache.init(),
      scoresBeatmapEntryCache.init(),
      bgCache.init(),
    ])
    const result: Beatmap[] = []
    for (const [md5, bmEntry] of beatmapEntryCache.value.entries()) {
      const scoresEntry = scoresBeatmapEntryCache.value.get(md5)
      const scores = scoresEntry
        ? scoresEntry.scores.map(s => new StableScore(s))
        : []
      result.push(new StableBeatmap(bmEntry, scores))
    }
    // 非常驻查询时释放缓存内存
    if (!useCache) {
      beatmapEntryCache.reset()
      scoresBeatmapEntryCache.reset()
    }
    return result
  })
}
