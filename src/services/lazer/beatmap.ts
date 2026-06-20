import type { RankedStatus } from 'osu-stable-db'
import { api } from '@/api'
import type { Beatmap, Score } from '@/models'
import type { LazerBeatmap as LazerBeatmapRaw, BeatmapMetadata, BeatmapDifficulty } from '@/api/lazer-types'
import { getSRData } from '@/services/mania-sr'
import { getExpandedBeatmap } from './expanded-cache'
import { LazerScore } from './score'

function resolveMetadata(m: string | BeatmapMetadata | undefined): BeatmapMetadata | undefined {
  if (!m) return undefined
  if (typeof m === 'string') return undefined
  return m
}

function resolveDifficulty(d: string | BeatmapDifficulty | undefined): BeatmapDifficulty | undefined {
  if (!d) return undefined
  if (typeof d === 'string') return undefined
  return d
}

/**
 * Map lazer BeatmapOnlineStatus ↔ BasicFilter RankedStatus.
 * Lazer:   -2(Graveyard) -1(WIP)  0(Pending)  1(Ranked)  2(Approved)  3(Qualified)  4(Loved)
 * Filter:   0(Unknown)    1(Unsub)  2(Pending)  4(Ranked)  5(Approved)  6(Qualified)  7(Loved)
 */
const LAZER_TO_FILTER: Record<number, RankedStatus> = { '-2': 1, '-1': 2, '0': 2, '1': 4, '2': 5, '3': 6, '4': 7 }

function toRankedStatus(status: number): RankedStatus {
  return LAZER_TO_FILTER[status] ?? 0
}

export class LazerBeatmap implements Beatmap {
  readonly client = 'lazer' as const
  readonly scores: readonly Score[]

  constructor(
    private readonly entry: LazerBeatmapRaw,
    scores?: readonly Score[],
  ) {
    this.scores = scores ?? this.#parseScores()
  }

  #parseScores(): readonly Score[] {
    const raw = this.entry.Scores
    if (!raw || typeof raw === 'string') return []
    return raw.map(s => new LazerScore(s))
  }

  get title(): string {
    const m = resolveMetadata(this.entry.Metadata)
    return m?.Title ?? this.entry.DifficultyName
  }
  get artist(): string {
    const m = resolveMetadata(this.entry.Metadata)
    return m?.Artist ?? ''
  }
  get titleUnicode(): string {
    const m = resolveMetadata(this.entry.Metadata)
    return m?.TitleUnicode ?? this.title
  }
  get artistUnicode(): string {
    const m = resolveMetadata(this.entry.Metadata)
    return m?.ArtistUnicode ?? this.artist
  }
  get creator(): string {
    const m = resolveMetadata(this.entry.Metadata)
    if (!m) return ''
    if (typeof m.Author === 'string') return m.Author
    return m.Author?.Username ?? ''
  }
  get difficulty(): string { return this.entry.DifficultyName }
  get key(): number {
    const d = resolveDifficulty(this.entry.Difficulty)
    return d ? Math.round(d.CircleSize) : 0
  }
  get OD(): number {
    const d = resolveDifficulty(this.entry.Difficulty)
    return d?.OverallDifficulty ?? 0
  }
  get HP(): number {
    const d = resolveDifficulty(this.entry.Difficulty)
    return d?.DrainRate ?? 0
  }
  get lengthMs(): number { return Math.round(this.entry.Length) }
  get rankedStatus(): RankedStatus { return toRankedStatus(this.entry.Status ?? this.entry.StatusInt) }
  get noteCount(): number { return this.entry.TotalObjectCount }
  get holdCount(): number { return 0 }
  get beatmapId(): number { return this.entry.OnlineID }
  get md5Hash(): string { return this.entry.MD5Hash }
  get bpm(): number { return this.entry.BPM }
  get lastModifiedTime(): Date {
    const d = this.entry.LastOnlineUpdate ?? this.entry.LastLocalUpdate
    return d ? new Date(d) : new Date()
  }
  get lastPlayed(): Date | null {
    if (!this.entry.LastPlayed) return null
    return new Date(this.entry.LastPlayed)
  }

  get osuFileUrl(): string {
    return `/api/lazer/files/${encodeURIComponent(this.entry.Hash)}`
  }

  get audioUrl(): string { return '' }

  get maniaSR(): import('@/api/types').ManiaSRData | null {
    return getSRData(this.entry.MD5Hash) ?? null
  }

  async getBackgroundUrl(): Promise<string | null> {
    const m = resolveMetadata(this.entry.Metadata)
    const bgFile = m?.BackgroundFile
    if (!bgFile) return null

    const bm = await getExpandedBeatmap(this.entry.MD5Hash)
    if (!bm) return null

    const set = typeof bm.BeatmapSet === 'string' ? null : bm.BeatmapSet
    if (!set) return null

    const files = typeof set.Files === 'string' ? null : set.Files
    if (!files) return null

    const match = files.find(f => f.Filename === bgFile)
    if (!match) return null

    const hash = typeof match.File === 'string' ? null : match.File.Hash
    return hash ? api.getLazerFileUrl(hash) : null
  }
}
