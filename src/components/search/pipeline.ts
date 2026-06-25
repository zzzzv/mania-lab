import type { Beatmap, CardItem, Score } from '@/models'
import type { SearchState, SortField, QueryState, ScoreSelectorMode } from './types'
import { lastPlayedTicks } from './types'
import { timed } from '@/services/timing'

// ── Helpers ──

function sortValue(b: Beatmap, field: SortField): number | string | Date {
  switch (field) {
    case 'title': return b.title
    case 'artist': return b.artist
    case 'creator': return b.creator
    case 'difficulty': return b.difficulty
    case 'key': return b.key
    case 'OD': return b.OD
    case 'HP': return b.HP
    case 'lengthMs': return b.lengthMs
    case 'rankedStatus': return b.rankedStatus
    case 'noteCount': return b.noteCount
    case 'holdCount': return b.holdCount
    case 'bpm': return b.bpm
    case 'lastModifiedTime': return b.lastModifiedTime
    case 'scores.length': return b.scores.length
    case 'maniaSR.PPY.NM': return b.maniaSR?.PPY.NM ?? 0
    case 'maniaSR.XXY.NM': return b.maniaSR?.XXY.NM ?? 0
  }
}

export function applyQuery(items: readonly Beatmap[], query: QueryState): Beatmap[] {
  let result = [...items]
  if (query.keys.length > 0) {
    result = result.filter(x => query.keys.some(k => k === -1 ? x.key < 4 : k === -2 ? x.key > 10 : k === x.key))
  }
  if (query.rankedStatuses.length > 0) result = result.filter(x => query.rankedStatuses.includes(x.rankedStatus))
  const words = query.searchText.trim().toLowerCase().split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    result = result.filter(x => {
      const haystack = [x.title, x.titleUnicode, x.artist, x.artistUnicode, x.creator, x.difficulty].join(' ').toLowerCase()
      return words.every(w => haystack.includes(w))
    })
  }
  // LastPlayed filter
  const lp = query.lastPlayed
  const TICKS = lastPlayedTicks()
  const minDayVal = TICKS[lp.minIdx]!
  const maxDayVal = TICKS[lp.maxIdx]!
  const hasLp = lp.minIdx > 0 || (isFinite(maxDayVal) && maxDayVal > 0) || !lp.unplayed
  if (hasLp) {
    const now = Date.now()
    const DAY_MS = 86400000
    result = result.filter(x => {
      const played = x.lastPlayed
      if (!played) return lp.unplayed
      const days = (now - played.getTime()) / DAY_MS
      if (days < minDayVal) return false
      if (isFinite(maxDayVal) && days > maxDayVal) return false
      return true
    })
  }
  return result
}

function applyFilter(items: readonly Beatmap[], sr: { ppyMin: number; ppyMax: number | null; xxyMin: number; xxyMax: number | null }): Beatmap[] {
  if (!(sr.ppyMin > 0 || sr.ppyMax !== null || sr.xxyMin > 0 || sr.xxyMax !== null)) return [...items]
  return items.filter(x => {
    const m = x.maniaSR
    if (!m) return false
    if (m.PPY.NM < sr.ppyMin) return false
    if (sr.ppyMax !== null && m.PPY.NM > sr.ppyMax) return false
    if (m.XXY.NM < sr.xxyMin) return false
    if (sr.xxyMax !== null && m.XXY.NM > sr.xxyMax) return false
    return true
  })
}

function isBetter(a: Score, b: Score, beatmap: Beatmap, mode: ScoreSelectorMode): boolean {
  switch (mode) {
    case 'latest': return a.date > b.date
    case 'bestScore': return a.totalScore > b.totalScore
    case 'bestAcc': return a.accuracy > b.accuracy
    case 'bestPP': return a.getPP(beatmap).pp > b.getPP(beatmap).pp
    default: return false
  }
}

function applyScoreSelector(items: readonly Beatmap[], mode: ScoreSelectorMode): CardItem[] {
  if (mode === 'overview') return items.map(b => ({ beatmap: b, selectedScoreIndex: null }))
  return items
    .filter(b => b.scores.length > 0)
    .map(b => ({
      beatmap: b,
      selectedScoreIndex: b.scores.reduce((best, cur, i) =>
        isBetter(cur, b.scores[best]!, b, mode) ? i : best
      , 0),
    }))
}

function applySort(items: CardItem[], field: SortField): CardItem[] {
  return [...items].sort((a, b) => {
    const va = sortValue(a.beatmap, field)
    const vb = sortValue(b.beatmap, field)
    if (va < vb) return -1
    if (va > vb) return 1
    return 0
  })
}

let _cachedItems: readonly Beatmap[] = []
let _cacheKey = ''

export function runSearch(items: readonly Beatmap[], s: SearchState): CardItem[] {
  return timed('filter', 100, () => {
    const key = `${items.length}|${JSON.stringify(s.query)}`
    if (key !== _cacheKey) {
      _cacheKey = key
      _cachedItems = applyQuery(items, s.query)
    }
    const filtered = applyFilter(_cachedItems, s.filter.srRange)
    let result = applyScoreSelector(filtered, s.filter.scoreMode)
    if (s.filter.sortField) result = applySort(result, s.filter.sortField)
    return result
  })
}
