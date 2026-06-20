import type { BeatmapEntry } from 'osu-stable-db'
import { dateTimeTicksToDate } from 'osu-stable-db'
import { api } from '@/api'
import type { Beatmap } from '@/models'
import { useSettingsStore } from '@/stores/settings'
import { getSRData } from '@/services/mania-sr'
import { bgCache } from './cache'

async function fallbackBg(): Promise<string | null> {
  try {
    if (!bgCache.initialized) await bgCache.init()
    const urls = [...bgCache.value.entries()].map(([, url]) => url)
    if (urls.length === 0) return null
    return urls[Math.floor(Math.random() * urls.length)] ?? null
  } catch { return null }
}

export class StableBeatmap implements Beatmap {
  readonly client = 'stable' as const
  readonly scores: readonly import('@/models').Score[]

  constructor(
    private readonly entry: BeatmapEntry,
    scores: readonly import('@/models').Score[] = [],
  ) {
    this.scores = scores
  }

  get title(): string {
    const { useUnicode } = useSettingsStore()
    return useUnicode && this.entry.titleUnicode
      ? this.entry.titleUnicode
      : (this.entry.title ?? '')
  }
  get artist(): string {
    const { useUnicode } = useSettingsStore()
    return useUnicode && this.entry.artistUnicode
      ? this.entry.artistUnicode
      : (this.entry.artist ?? '')
  }
  get titleUnicode(): string { return this.entry.titleUnicode ?? this.title }
  get artistUnicode(): string { return this.entry.artistUnicode ?? this.artist }
  get creator(): string { return this.entry.creator ?? '' }
  get difficulty(): string { return this.entry.difficultyName ?? '' }
  get key(): number { return Math.round(this.entry.circleSize) }
  get OD(): number { return this.entry.overallDifficulty }
  get HP(): number { return this.entry.hpDrain }
  get lengthMs(): number { return this.entry.totalTimeMs }
  get rankedStatus() { return this.entry.rankedStatus }
  get noteCount(): number { return this.entry.hitCircleCount + this.entry.sliderCount }
  get holdCount(): number { return this.entry.sliderCount }
  get beatmapId(): number { return this.entry.beatmapId }
  get md5Hash(): string { return this.entry.md5Hash ?? '' }
  get bpm(): number {
    // timingPoint.bpm is beat length (ms), actual BPM = 60000 / beatLength
    const uninherited = this.entry.timingPoints?.filter(t => t.isUninherited) ?? []
    if (uninherited.length === 0) return 0
    if (uninherited.length === 1) return Math.round(60000 / uninherited[0]!.bpm)
    // Find the uninherited timing point with the longest duration
    let best = uninherited[0]!
    let bestDuration = 0
    for (let i = 0; i < uninherited.length; i++) {
      const cur = uninherited[i]!
      const next = uninherited[i + 1]
      const end = next ? next.offsetMs : this.entry.totalTimeMs
      const duration = end - cur.offsetMs
      if (duration > bestDuration) {
        bestDuration = duration
        best = cur
      }
    }
    return Math.round(60000 / best.bpm)
  }
  get lastModifiedTime(): Date { return dateTimeTicksToDate(this.entry.lastModificationTime) }
  get lastPlayed(): Date | null {
    if (this.entry.isUnplayed) return null
    return dateTimeTicksToDate(this.entry.lastPlayedAt)
  }
  get osuFileUrl(): string {
    return api.getStableFileUrl(`Songs/${this.entry.beatmapFolderName}/${this.entry.osuFileName}`)
  }
  get audioUrl(): string {
    return api.getStableFileUrl(`Songs/${this.entry.beatmapFolderName}/${this.entry.audioFileName}`)
  }

  get maniaSR(): import('@/api/types').ManiaSRData | null {
    return getSRData(this.entry.md5Hash ?? '') ?? null
  }

  async getBackgroundUrl(): Promise<string | null> {
    try {
      if (!this.entry.beatmapFolderName) return fallbackBg()
      const folder = await api.listStableFolder(`Songs/${this.entry.beatmapFolderName}`)
      const osuFile = folder.files.find(f => f.name === this.entry.osuFileName)
      if (!osuFile) return fallbackBg()

      const osuFileUrl = api.getStableFileUrl(`Songs/${this.entry.beatmapFolderName}/${osuFile.name}`)
      const res = await fetch(osuFileUrl)
      const text = await res.text()
      const match = text.match(/\[Events\][\s\S]*?^0,0,"(.+?)"/m)
      if (!match) return fallbackBg()

      if (folder.files.some(f => f.name === match[1])) {
        return api.getStableFileUrl(`Songs/${this.entry.beatmapFolderName}/${match[1]}`)
      }
      return fallbackBg()
    } catch { return fallbackBg() }
  }
}


