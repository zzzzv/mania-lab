import { expect, test } from 'vitest';
import { ManiaReplayFrame } from 'osu-mania-stable';
import { OsuPlayer } from '../src/index';
import { summarize } from '../src/utils';
import { readFixture, convertBeatmap, convertReplay, formatScoreInfo } from './utils';

async function executeReplay(name: string) {
  const { beatmap, score } = await readFixture(name);
  const convertedBeatmap = convertBeatmap(beatmap);
  const replay = convertReplay(convertedBeatmap.keys, score.replay!.frames as ManiaReplayFrame[]);
  const player = new OsuPlayer(convertedBeatmap, replay);
  const notes = player.play();
  return { notes, score };
}

async function runTest(name: string) {
  const { notes, score } = await executeReplay(name);
  const summary = summarize(notes);
  const info = formatScoreInfo(score.info);

  expect(summary.totalHits).toBe(info.totalHits);
  expect.soft(summary.accuracy).toBeCloseTo(info.accuracy, 5);
  expect.soft(summary.maxCombo).toBe(info.maxCombo);
  expect.soft(summary.counts).toEqual(info.counts);
};

test.for(['7kreg7j', '7kreg8st'])('%s', name => runTest(name));

test.for(['7kln9g'])('%s', name => runTest(name));