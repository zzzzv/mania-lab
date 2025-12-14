import { ManiaBeatmap, ManiaReplayFrame, Hold } from 'osu-mania-stable';

export function convertBeatmap(beatmap: ManiaBeatmap) {
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

export function convertFrames(keys: number, frames: ManiaReplayFrame[]) {
  return frames.map(frame => ({
    time: frame.startTime,
    keyStates: Array.from({ length: keys }, (_, i) => frame.actions.has(i + 10)),
  }));
}