import fs from 'fs';
import path from 'path';
import { ScoreInfo } from 'osu-classes';
import { BeatmapDecoder, ScoreDecoder } from 'osu-parsers';
import { ManiaRuleset, ManiaBeatmap, ManiaReplayFrame, Hold } from 'osu-mania-stable';
import { Beatmap, ReplayFrame } from '../src/index';

const FIXTURE_DIR = 'tests/fixtures/';

export async function readFixture(name: string, replay?: string) {
  const dataPath = path.join(FIXTURE_DIR, name);
  const isDir = fs.existsSync(dataPath) && fs.statSync(dataPath).isDirectory();

  const beatmapPath = isDir ? path.join(dataPath, 'beatmap.osu') : dataPath + '.osu';
  const replayPath = isDir ? path.join(dataPath, (replay ?? 'nm') + '.osr') : (replay ?? dataPath) + '.osr';

  const beatmap = await new BeatmapDecoder().decodeFromPath(beatmapPath, { parseStoryboard: false });
  const score = await new ScoreDecoder().decodeFromPath(replayPath, true);

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
    keys: beatmap.totalColumns,
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

export function hasHold(beatmap: Beatmap): boolean {
  return beatmap.notes.some(note => note.end !== undefined);
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