import { Grades } from 'osu-stable-db'
import type { Grade, ModFlags } from 'osu-stable-db'
import type { HitResultTable } from 'mania-judge'
import type { Beatmap, Score } from '@/models'
import type { LazerScore as LazerScoreRaw, HitStatistics } from '@/api/lazer-types'
import type { APIModInfo } from '@/models'
import { getScorePP } from '@/services/mania-pp'
import { getExpandedBeatmap } from './expanded-cache'

function parseHitStatistics(stats: string | HitStatistics | undefined): HitStatistics {
  if (!stats) return {}
  if (typeof stats === 'string') {
    try { return JSON.parse(stats) }
    catch { return {} }
  }
  return stats
}

function modsToFlags(mods: string | string[] | Record<string, never>[] | APIModInfo[] | undefined): ModFlags {
  if (!mods) return 0
  if (typeof mods === 'string') {
    try {
      const parsed = JSON.parse(mods) as { acronym: string }[]
      return acronymsToFlags(parsed.map(m => m.acronym))
    } catch { return 0 }
  }
  if (Array.isArray(mods)) {
    if (mods.length === 0) return 0
    if (typeof mods[0] === 'string') return acronymsToFlags(mods as string[])
    if (typeof mods[0] === 'object') {
      return acronymsToFlags((mods as APIModInfo[]).map(m => 'Acronym' in m ? m.Acronym : ''))
    }
  }
  return 0
}

// TODO: lazer 的 mod 体系与 stable 不完全兼容，后续需要完整映射
function acronymsToFlags(acronyms: string[]): ModFlags {
  let flags = 0
  for (const a of acronyms) {
    switch (a) {
      case 'EZ': flags |= 2; break
      case 'NF': flags |= 1; break
      case 'HT': flags |= 256; break
      case 'HR': flags |= 16; break
      case 'SD': flags |= 32; break
      case 'PF': flags |= 16384; break
      case 'DT': flags |= 64; break
      case 'NC': flags |= 512; break
      case 'FL': flags |= 1024; break
      case 'FI': flags |= 4096; break
      default:
        // console.warn(`[LazerScore] unknown mod acronym: "${a}"`)
    }
  }
  return flags
}

export class LazerScore implements Score {
  private _entry: LazerScoreRaw

  constructor(entry: LazerScoreRaw) {
    this._entry = entry
  }

  get playerName(): string {
    const r = this._entry.RealmUser
    if (typeof r === 'string') return r
    return r.Username
  }

  get totalScore(): number { return this._entry.LegacyTotalScore ?? this._entry.TotalScore }
  get maxCombo(): number { return this._entry.MaxCombo }
  get perfectCombo(): boolean { return this._entry.Perfect ?? false }
  get accuracy(): number { return this._entry.Accuracy }

  get grade(): Grade {
    const acc = this.accuracy
    if (acc >= 1) return Grades.X
    if (acc >= 0.95) return Grades.S
    if (acc >= 0.90) return Grades.A
    if (acc >= 0.80) return Grades.B
    if (acc >= 0.70) return Grades.C
    return Grades.D
  }

  get hitResults(): HitResultTable<number> {
    const s = parseHitStatistics(this._entry.Statistics)
    return [
      s.Perfect ?? 0,   // geki
      s.Great ?? 0,     // 300
      s.Good ?? 0,      // katu
      s.Ok ?? 0,        // 100
      s.Meh ?? 0,       // 50
      s.Miss ?? 0,      // miss
    ]
  }

  get mods(): ModFlags {
    return modsToFlags((this._entry as any).APIMods ?? this._entry.Mods)
  }

  get date(): Date {
    const d = this._entry.Date
    return typeof d === 'string' ? new Date(d) : new Date()
  }

  get replayUrl(): string { return '' }

  getPP(bm: Beatmap): { pp: number; maxPP: number; ppAcc: number } {
    return getScorePP(bm, this.mods, this.hitResults)
  }

  /**
   * Fetch expanded APIMods for this score from the backend.
   * Shares the single-beatmap request cache with LazerBeatmap.getBackgroundUrl().
   */
  async getAPIMods(): Promise<APIModInfo[]> {
    // Try parsing APIMods from the entry first (may be JSON string from batch query)
    const local = this._parseEntryAPIMods()
    if (local.length > 0) return local

    // Fall back to expanded single-beatmap fetch
    const bm = await getExpandedBeatmap(this._entry.BeatmapHash)
    if (!bm) return []
    const rawScores = bm.Scores
    if (typeof rawScores === 'string') return []
    const match = rawScores.find(s => s.ID === this._entry.ID)
    if (!match) return []
    return this._extractAPIMods((match as any).APIMods)
  }

  private _parseEntryAPIMods(): APIModInfo[] {
    return this._extractAPIMods((this._entry as any).APIMods)
  }

  private _extractAPIMods(raw: unknown): APIModInfo[] {
    if (!raw) return []
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw)
        return this._parseModArray(parsed)
      } catch { return [] }
    }
    return this._parseModArray(raw)
  }

  private _parseModArray(arr: unknown): APIModInfo[] {
    if (!Array.isArray(arr)) return []
    // Array of objects like { Acronym: "DT", Settings: { ... } }
    const objects = arr.filter(m => m && typeof m === 'object' && 'Acronym' in m)
    if (objects.length > 0) return objects as APIModInfo[]
    // Array of ToString strings like "DT (speed_change:1.05)" or "CL"
    return arr.map((item: unknown) => {
      if (typeof item !== 'string') return null
      const match = item.match(/^(\w+)(?:\s*\(.*?(\d+\.?\d*).*?\))?$/)
      if (!match) return null
      const info: APIModInfo = { Acronym: match[1]! }
      const num = match[2]
      if (num) info.Settings = { value: parseFloat(num) }
      return info
    }).filter(Boolean) as APIModInfo[]
  }
}

