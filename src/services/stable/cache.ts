import { readOsuDatabase, readScoresDatabase, GameplayModes } from 'osu-stable-db'
import type { BeatmapEntry, ScoresBeatmapEntry } from 'osu-stable-db'
import { api } from '@/api'
import { DataCache } from '@/services/utils'

export const beatmapEntryCache = new DataCache(async () => {
  const buf = await api.fetchStableFile('osu!.db')
  const db = readOsuDatabase(new Uint8Array(buf))
  return new Map(
    db.beatmaps
      .filter(b => b.gameplayMode === GameplayModes.Mania && b.md5Hash != null)
      .map(b => [b.md5Hash!, b]),
  )
})

export const scoresBeatmapEntryCache = new DataCache(async () => {
  const buf = await api.fetchStableFile('scores.db')
  const db = readScoresDatabase(new Uint8Array(buf))
  return new Map(
    db.beatmaps.map(e => [e.beatmapMd5Hash ?? '', e]),
  )
})

export const bgCache = new DataCache(async () => {
  const res = await api.listStableFolder('Data/bg')
  const map = new Map<string, string>()
  for (const f of res.files) {
    if (/\.(jpe?g|png|bmp|gif)$/i.test(f.name)) {
      const url = api.getStableFileUrl(`Data/bg/${f.name}`)
      map.set(f.name, url)
    }
  }
  return map
})
