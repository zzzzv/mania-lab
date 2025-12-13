import { ManiaBeatmap, Hold } from 'osu-mania-stable';

export function convertToLibStruct(beatmap: ManiaBeatmap) {
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
  };
}