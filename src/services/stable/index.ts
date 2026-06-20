import type { Beatmap } from '@/models'
import { StableBeatmap } from './beatmap'
import { StableScore } from './score'
import { beatmapEntryCache, scoresBeatmapEntryCache, bgCache } from './cache'
import { srCache } from '@/services/mania-sr'
import { timed } from '@/services/timing'

export async function getBeatmaps(): Promise<Beatmap[]> {
  return timed('getBeatmaps', 100, async () => {
    await Promise.all([
      beatmapEntryCache.init(),
      scoresBeatmapEntryCache.init(),
      bgCache.init(),
      srCache.init(),
    ])
    const result: Beatmap[] = []
    for (const [md5, bmEntry] of beatmapEntryCache.value.entries()) {
      const scoresEntry = scoresBeatmapEntryCache.value.get(md5)
      const scores = scoresEntry
        ? scoresEntry.scores.map(s => new StableScore(s))
        : []
      result.push(new StableBeatmap(bmEntry, scores))
    }
    return result
  })
}
