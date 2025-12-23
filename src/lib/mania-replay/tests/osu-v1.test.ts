import { expect, test } from 'vitest';
import { ManiaReplayFrame } from 'osu-mania-stable';
import { osuV1 } from '../src/index';
import { summarize } from '../src/utils';
import { readFixture, convertBeatmap, convertReplay, formatScoreInfo, hasHold } from './utils';

async function runTest(name: string) {
  const { beatmap, score } = await readFixture(name);
  const convertedBeatmap = convertBeatmap(beatmap);
  const replay = convertReplay(convertedBeatmap.keys, score.replay!.frames as ManiaReplayFrame[]);
  const notes = osuV1.play(convertedBeatmap, replay);
  const summary = summarize(notes, osuV1.levelAccuracies);
  const info = formatScoreInfo(score.info);

  expect(summary.totalHits).toBe(info.totalHits);
  expect.soft(summary.accuracy).toBeCloseTo(info.accuracy, 5);
  if (!hasHold(convertedBeatmap)) {
    expect.soft(summary.maxCombo).toBe(info.maxCombo);
  }
  expect.soft(summary.counts).toEqual(info.counts);
};

test.for(['7kreg7j', '7kreg8st'])('%s', name => runTest(name));

test.for(['sparkle', 'samsa', 'pupa'])('%s', name => runTest(name));

test.for(['7kln9g', '7kln10i'])('%s', name => runTest(name));