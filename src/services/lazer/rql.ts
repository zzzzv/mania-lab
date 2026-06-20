import type { RankedStatus } from 'osu-stable-db'
import type { QueryState } from '@/components/search/types'
import { lastPlayedTicks } from '@/components/search/types'

/**
 * Map lazer BeatmapOnlineStatus ↔ BasicFilter RankedStatus.
 * Lazer:   -2(Graveyard) -1(WIP)  0(Pending)  1(Ranked)  2(Approved)  3(Qualified)  4(Loved)
 * Filter:   0(Unknown)    1(Unsub)  2(Pending)  4(Ranked)  5(Approved)  6(Qualified)  7(Loved)
 */
const FILTER_TO_LAZER: Record<number, number> = { '0': 0, '1': -2, '2': 0, '4': 1, '5': 2, '6': 3, '7': 4 }

function stableToLazerStatus(s: RankedStatus): number {
  return FILTER_TO_LAZER[s] ?? 0
}

function quote(s: string): string {
  return `"${s.replace(/"/g, '\\"')}"`
}

/** Format a Date for Realm RQL: YYYY-MM-DD@HH:mm:ss:nnnnnnnnnn */
function fmtDate(d: Date): string {
  const iso = d.toISOString()                    // "2026-05-25T12:36:33.347Z"
  const [dt, rest] = iso.split('.')
  const ms = (rest ?? '0').replace('Z', '')      // "347"
  return `${dt}:${ms.padEnd(9, '0')}`            // "2026-05-25T12:36:33:347000000"
}

/** Build an RQL query from query state. */
export function buildRql(q: QueryState): string {
  const parts: string[] = ['Ruleset.ShortName=="mania"']

  if (q.keys.length > 0) {
    const ors = q.keys.map(k => `Difficulty.CircleSize==${k}`)
    parts.push(ors.length === 1 ? ors[0]! : `(${ors.join(' OR ')})`)
  }

  if (q.rankedStatuses.length > 0) {
    const ors = q.rankedStatuses.map(s => `Status==${stableToLazerStatus(s)}`)
    parts.push(ors.length === 1 ? ors[0]! : `(${ors.join(' OR ')})`)
  }

  const words = q.searchText.trim().split(/\s+/).filter(Boolean)
  if (words.length > 0) {
    const searchFields = ['DifficultyName', 'Metadata.Title', 'Metadata.Artist', 'Metadata.Author.Username']
    const wordClauses = words.map(w =>
      `(${searchFields.map(f => `${f} CONTAINS[c] ${quote(w)}`).join(' OR ')})`,
    )
    parts.push(wordClauses.length === 1 ? wordClauses[0]! : wordClauses.join(' AND '))
  }

  // LastPlayed filter
  const lp = q.lastPlayed
  const TICKS = lastPlayedTicks()
  const minDayVal = TICKS[lp.minIdx]!
  const maxDayVal = TICKS[lp.maxIdx]!
  if (lp.minIdx > 0 || (isFinite(maxDayVal) && maxDayVal > 0) || !lp.unplayed) {
    const now = new Date()
    const hasMin = lp.minIdx > 0
    const hasMax = isFinite(maxDayVal) && maxDayVal > 0
    if (hasMin && hasMax) {
      const lo = fmtDate(new Date(now.getTime() - maxDayVal * 86400000))
      const hi = fmtDate(new Date(now.getTime() - minDayVal * 86400000))
      parts.push(`LastPlayed >= ${lo} AND LastPlayed <= ${hi}`)
    } else if (hasMin) {
      parts.push(`LastPlayed <= ${fmtDate(new Date(now.getTime() - minDayVal * 86400000))}`)
    } else if (hasMax) {
      parts.push(`LastPlayed >= ${fmtDate(new Date(now.getTime() - maxDayVal * 86400000))}`)
    }
    if (!lp.unplayed) {
      parts.push('LastPlayed != NULL')
    }
  }

  return parts.join(' AND ')
}
