import { dateTimeTicksToDate, Grades, Mods, getScoreRelativeOsrFilePath } from 'osu-stable-db'
import type { ScoreEntry, Grade } from 'osu-stable-db'
import { calcAccuracy, v1 } from 'mania-judge'
import type { HitResultTable } from 'mania-judge'
import { api } from '@/api'
import type { Beatmap, Score } from '@/models'
import { getScorePP } from '@/services/mania-pp'

export class StableScore implements Score {
  constructor(
    private readonly entry: ScoreEntry,
  ) {}
  get playerName(): string { return this.entry.playerName ?? '' }
  get totalScore(): number { return this.entry.totalScore }
  get maxCombo(): number { return this.entry.maxCombo }
  get perfectCombo(): boolean { return this.entry.perfectCombo }
  get mods() { return this.entry.mods }
  get date(): Date { return dateTimeTicksToDate(this.entry.replayTimestamp) }
  get replayUrl(): string {
    return api.getStableFileUrl(getScoreRelativeOsrFilePath(this.entry))
  }

  get accuracy(): number {
    return calcAccuracy(this.hitResults, v1.accTable)
  }

  get hitResults(): HitResultTable<number> {
    return [
      this.entry.countGeki,
      this.entry.count300,
      this.entry.countKatu,
      this.entry.count100,
      this.entry.count50,
      this.entry.countMiss,
    ]
  }

  getPP(bm: Beatmap): { pp: number; maxPP: number; ppAcc: number } {
    return getScorePP(bm, this.mods, this.hitResults)
  }

  get grade(): Grade {
    const SILVER_MODS = Mods.Hidden | Mods.Flashlight | Mods.FadeIn
    const silver = (this.entry.mods & SILVER_MODS) !== 0
    const acc = this.accuracy
    if (acc >= 1) return silver ? Grades.XH : Grades.X
    if (acc >= 0.95) return silver ? Grades.SH : Grades.S
    if (acc >= 0.90) return Grades.A
    if (acc >= 0.80) return Grades.B
    if (acc >= 0.70) return Grades.C
    return Grades.D
  }
}
