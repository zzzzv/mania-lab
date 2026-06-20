import { calcAccuracy } from 'mania-judge'
import type { HitResultTable } from 'mania-judge'
import type { ModFlags } from 'osu-stable-db'
import { Mods } from 'osu-stable-db'
import type { Beatmap } from '@/models'

const maniaAccTable: Readonly<HitResultTable<number>> = [1, 0.9375, 0.625, 0.3125, 0.15625, 0]

/**
 * https://page.27345861.xyz/docs/mania_number/pp.html
 */
function calcDifficulty(sr: number): number {
  return Math.pow(Math.max(sr - 0.15, 0.05), 2.2)
}

function calcLengthParam(totalNotes: number): number {
  return totalNotes <= 1500 ? 1 + totalNotes / 1500 * 0.1 : 1.1
}

function calcAccParam(accuracy: number): number {
  return 5 * accuracy - 4
}

export function getPPModMultiplier(mods: ModFlags): number {
  if (mods & Mods.Random || mods & Mods.ScoreV2) return 0
  let mul = 1
  if (mods & Mods.Easy) mul *= 0.5
  if (mods & Mods.NoFail) mul *= 0.75
  return mul
}

export function calcPP(
  hitResults: HitResultTable<number>,
  sr: number,
  totalNotes: number,
): { pp: number; maxPP: number; accuracy: number } {
  const accuracy = calcAccuracy(hitResults, maniaAccTable)
  const maxPP = accuracy >= 0.8
    ? 8 * calcDifficulty(sr) * calcLengthParam(totalNotes) * calcAccParam(1)
    : 0
  if (accuracy < 0.8) return { pp: 0, maxPP, accuracy }
  const pp = 8 * calcDifficulty(sr) * calcLengthParam(totalNotes) * calcAccParam(accuracy)
  return { pp, maxPP, accuracy }
}

export function getScorePP(bm: Beatmap, mods: ModFlags, hitResults: HitResultTable<number>): { pp: number; maxPP: number; ppAcc: number } {
  const mul = getPPModMultiplier(mods)
  if (mul === 0) return { pp: 0, maxPP: 0, ppAcc: 0 }
  const sr = bm.maniaSR?.PPY.NM ?? 0
  const { pp, maxPP, accuracy } = calcPP(hitResults, sr, bm.noteCount + bm.holdCount)
  return { pp: pp * mul, maxPP: maxPP * mul, ppAcc: accuracy }
}
