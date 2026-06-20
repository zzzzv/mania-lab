import type { RankedStatus, ModFlags, Grade } from 'osu-stable-db'
import type { HitResultTable } from 'mania-judge'

export interface APIModInfo {
  Acronym: string
  Settings?: string | Record<string, unknown>
}

export type Client = 'stable' | 'lazer'

export interface Beatmap {
  readonly client: Client
  readonly title: string
  readonly titleUnicode: string
  readonly artist: string
  readonly artistUnicode: string
  readonly creator: string
  readonly difficulty: string
  readonly key: number
  readonly OD: number
  readonly HP: number
  readonly lengthMs: number
  readonly rankedStatus: RankedStatus
  readonly noteCount: number
  readonly holdCount: number
  readonly beatmapId: number
  readonly md5Hash: string
  readonly osuFileUrl: string
  readonly audioUrl: string
  readonly bpm: number
  readonly lastModifiedTime: Date
  readonly lastPlayed: Date | null
  readonly scores: readonly Score[]
  readonly maniaSR: import('@/api/types').ManiaSRData | null
  getBackgroundUrl: () => Promise<string | null>
}

export interface CardItem {
  beatmap: Beatmap
  selectedScoreIndex: number | null
}

export interface Score {
  readonly playerName: string
  readonly totalScore: number
  readonly maxCombo: number
  readonly perfectCombo: boolean
  readonly accuracy: number
  readonly grade: Grade
  readonly hitResults: HitResultTable<number>
  readonly mods: ModFlags
  readonly date: Date
  readonly replayUrl: string
  getPP: (beatmap: Beatmap) => { pp: number; maxPP: number; ppAcc: number }
  getAPIMods?: () => Promise<APIModInfo[]>
}


