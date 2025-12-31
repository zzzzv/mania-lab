import { expect, test, describe } from 'vitest';
import { ManiaReplayFrame } from 'osu-mania-stable';
import { osuV1 } from '../src/index';
import { summarize } from '../src/utils';
import type { Mod } from '../src/types'
import { readFixture, convertBeatmap, convertReplay, formatScoreInfo, hasHold } from './utils';

async function runTest(name: string, mod?: Mod, osr?: string) {
  const { beatmap, score } = await readFixture(name, osr ?? mod);
  const convertedBeatmap = convertBeatmap(beatmap);
  const replay = convertReplay(convertedBeatmap.keys, score.replay!.frames as ManiaReplayFrame[]);
  const notes = osuV1.play(convertedBeatmap, replay, mod);
  const summary = summarize(notes, osuV1.levelAccuracies);
  const info = formatScoreInfo(score.info);

  expect(summary.totalHits).toBe(info.totalHits);
  expect.soft(summary.accuracy).toBeCloseTo(info.accuracy, 5);
  if (!hasHold(convertedBeatmap)) {
    expect.soft(summary.maxCombo).toBe(info.maxCombo);
  }
  expect.soft(summary.counts).toEqual(info.counts);
};

describe('OsuV1 rice', () => {
  test.for(['7kreg7j', '7kreg8st'])('%s', name => runTest(name));
  test.for([['7kreg6', '95'], ['7kreg6', '96'], ['7kreg7', '95'], ['7kreg7', '96']])
    ('%s %s', ([name, osr]) => runTest(name, 'nm', osr));
});

describe('OsuV1 LN', () => {
  test.for(['sparkle', 'samsa', 'pupa'])('%s', name => runTest(name));
  test.for(['7kln9g', '7kln10i'])('%s', name => runTest(name));
  test.for([['7kln8', '95'], ['7kln8', '96'], ['7kln9', '95'], ['7kln9', '96']])
    ('%s %s', ([name, osr]) => runTest(name, 'nm', osr));
});

describe('OsuV1 mods', () => {
  test.for(['ez', 'hr'])('pupa %s', mod => runTest('pupa', mod as Mod));
});