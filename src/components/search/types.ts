import type { RankedStatus } from 'osu-stable-db'

export interface QueryState {
  keys: number[]
  rankedStatuses: RankedStatus[]
  searchText: string
  lastPlayed: LastPlayedFilter
}

export interface LastPlayedFilter {
  minIdx: number     // slider index into lastPlayedTicks
  maxIdx: number     // slider index into lastPlayedTicks
  unplayed: boolean  // include beatmaps with no play history
}

/** Build tick values for the last-played slider. */
export function lastPlayedTicks(): number[] {
  const arr: number[] = []
  for (let i = 0; i <= 30; i++) arr.push(i)
  for (let i = 35; i <= 90; i += 5) arr.push(i)
  for (let i = 120; i <= 360; i += 30) arr.push(i)
  for (let i = 720; i <= 1800; i += 360) arr.push(i)
  arr.push(Infinity)
  return arr
}

export interface SRRange {
  ppyMin: number
  ppyMax: number | null  // null = ∞
  xxyMin: number
  xxyMax: number | null  // null = ∞
}

export type SortField = 
  | 'title' | 'artist' | 'creator' | 'difficulty'
  | 'key' | 'OD' | 'HP' | 'lengthMs' | 'rankedStatus'
  | 'noteCount' | 'holdCount' | 'bpm' | 'lastModifiedTime'
  | 'scores.length' | 'maniaSR.PPY.NM' | 'maniaSR.XXY.NM'

export type ScoreSelectorMode = 'overview' | 'latest' | 'bestScore' | 'bestAcc' | 'bestPP'

export interface FilterState {
  srRange: SRRange
  sortField: SortField | null
  scoreMode: ScoreSelectorMode
}

// ── Top-level search state ──

export interface SearchState {
  client: 'stable' | 'lazer' | null
  lazerCache: boolean
  query: QueryState
  filter: FilterState
}

export type CompileResult<T> =
  | { ok: true; fn: T }
  | { ok: false; error: string }
