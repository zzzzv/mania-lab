import { readFileSync } from 'fs';
import { ScoreInfo } from 'osu-classes';
import { BeatmapDecoder, ScoreDecoder } from 'osu-parsers';
import { ManiaRuleset, ManiaBeatmap, ManiaReplayFrame, Hold } from 'osu-mania-stable';
import { Beatmap, ReplayFrame } from '../src/index';

export async function readFixture(name: string) {
  const dir = 'tests/fixtures/'
  const beatmapContent = readFileSync(`${dir}${name}.osu`, 'utf-8')
  const replayData = readFileSync(`${dir}${name}.osr`);
  const beatmap = new BeatmapDecoder().decodeFromString(beatmapContent, { parseStoryboard: false });
  const score = await new ScoreDecoder().decodeFromBuffer(replayData, true);

  const ruleset = new ManiaRuleset();
  const mods = ruleset.createModCombination(score.info.rawMods);
  const maniaBeatmap = ruleset.applyToBeatmapWithMods(beatmap, mods);
  const maniaReplay = ruleset.applyToReplay(score.replay!, maniaBeatmap);

  return {
    beatmap: maniaBeatmap,
    score: {
      ...score,
      replay: maniaReplay,
    },
  }
}

export function convertBeatmap(beatmap: ManiaBeatmap): Beatmap {
  return {
    keys: beatmap.difficulty.circleSize,
    od: beatmap.difficulty.overallDifficulty,
    notes: beatmap.hitObjects.map(obj => ({
      start: obj.startTime,
      end: obj instanceof Hold ? obj.endTime : undefined,
      column: obj.column,
    })),
    timingPoints: beatmap.controlPoints.timingPoints.map(tp => ({
      time: tp.startTime,
      bpm: tp.bpm,
      meter: tp.timeSignature,
    })),
  }
}

export function convertReplay(keys: number, frames: ManiaReplayFrame[]): ReplayFrame[] {
  return frames.map(frame => ({
    time: frame.startTime,
    keyStates: Array.from({ length: keys }, (_, i) => frame.actions.has(i + 10)),
  }));
}

export function formatScoreInfo(info: ScoreInfo) {
  return {
    date: info.date,
    counts: [
      info.countGeki,
      info.count300,
      info.countKatu,
      info.count100,
      info.count50,
      info.countMiss,
    ],
    totalHits: info.totalHits,
    accuracy: info.accuracy,
    maxCombo: info.maxCombo,
  }
}