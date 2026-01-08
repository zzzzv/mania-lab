import type { Beatmap, Note, ReplayFrame, PlayedNote, Mod } from './types';
import { createQueues, generateActions } from './utils';
import type { NoteQueue, Action } from './utils';

export const accTable = [1.0, 1.0, 2/3, 1/3, 1/6, 0.0];
export const nameTable = ['Perfect', 'Great', 'Good', 'Ok', 'Meh', 'Miss'];

function createWindows(od: number, mod: Mod = 'NM'): number[] {
  const baseWindows = [
    16,
    64 - 3 * od,
    97 - 3 * od,
    127 - 3 * od,
    151 - 3 * od,
    188 - 3 * od,
  ];
  const modFactor = mod === 'EZ' ? 1.4 : mod === 'HR' ? 1/1.4 : 1.0;
  return baseWindows.map(w => w * modFactor);
};

function toLNWindows(windows: Readonly<number[]>) {
  return windows.map((w, i) => i === 0 ? w * 1.2 : i === 1 ? w * 1.1 : w);
};

function getResult(offset: number, windows: Readonly<number[]>) {
  for (let i = 0; i < 3; i++) {
    if (offset >= -windows[i] && offset <= windows[i]) {
      return i;
    }
  }
  for (let i = 3; i < windows.length; i++) {
    if (offset >= -windows[i] && offset <= windows[3] - 1) {
      return i;
    }
  }
  return null;
};

function createJudgement(note: Readonly<Note>, baseWindows: Readonly<number[]>) {
  const playedNote: PlayedNote = {
    ...note,
    result: 5,
    actions: [] as number[],
  };
  const windows = note.end === undefined ? baseWindows : toLNWindows(baseWindows);
  let isProcessed = false;
  let dropped = false;
  let headTime: number | null = null;

  const onFrame = (time: number) => {
    if (isProcessed) return;

    isProcessed = note.end === undefined ?
      time > note.start + windows[3] - 1 :
      headTime === null && (
        (playedNote.actions.length > 0 && time > note.end + windows[3] - 1) ||
        (playedNote.actions.length === 0 && time > note.start + windows[3] - 1)
      );
    if (isProcessed) {
      return playedNote;
    }
  };

  const onHit = (time: number) => {
    if (isProcessed) return;
    
    if (note.end === undefined) {
      let level = getResult(time - note.start, windows);
      if (level !== null) {
        isProcessed = true;
        playedNote.result = level;
        playedNote.actions.push(time);
        return playedNote;
      }
    } else if (time >= note.start - windows[5] && time <= note.end + windows[3] - 1) {
      headTime = time < note.start - windows[4] ? note.end - 1 : time;
      playedNote.actions.push(time);
    }
  };

  const _getLNResult = (tailOffset: number) => {
    if (tailOffset < -windows[4]) return 5;

    const headResult = getResult(headTime! - note.start, windows) ?? 4;
    const clipTailOffset = Math.min(tailOffset, windows[4]);
    const meanOffset = (Math.abs(headTime! - note.start) + Math.abs(clipTailOffset)) / 2;
    const result = getResult(meanOffset, windows) ?? 4;
    return Math.max(headResult, result, dropped ? 2 : 0);
  };

  const onRelease = (time: number) => {
    if (note.end === undefined || isProcessed || headTime === null) return;

    const offset = time - note.end;
    if (offset < -windows[4]) {
      playedNote.result = _getLNResult(offset);
      playedNote.actions.push(time);
      dropped = true;
      headTime = null;
      return;
    }

    isProcessed = true;
    const level = _getLNResult(offset);
    playedNote.result = level;
    playedNote.actions.push(time);
    return playedNote;
  };

  return { note, get isProcessed() { return isProcessed; }, onFrame, onHit, onRelease };
}

type Judgement = ReturnType<typeof createJudgement>;

function createColumn(queue: NoteQueue, windows: number[]) {
  let current: Judgement | null = null;

  const next = (time: number) => {
    if (current === null || (current.isProcessed && time >= current.note.start)) {
      const nextNote = queue.pop();
      if (nextNote) {
        current = createJudgement(nextNote, windows);
      }
    }
  };

  const onFrame = (time: number) => {
    next(time);
    if (current) {
      return current.onFrame(time);
    }
  };

  const onAction = (time: number, action: Action) => {
    next(time);
    if (current) {
      if (action === 'press') {
        return current.onHit(time);
      } else if (action === 'release') {
        return current.onRelease(time);
      }
    }
  };

  return { onFrame, onAction };
}

export function play(
  beatmap: Beatmap,
  replayFrames: ReplayFrame[],
  mod: Mod = 'NM',
  resolution: 'ms' | 'replay' = 'replay'
): PlayedNote[] {
  const queues = createQueues(beatmap);
  const windows = createWindows(beatmap.od, mod);
  const columns = queues.map(q => createColumn(q, windows));
  const frames = generateActions(replayFrames, resolution);

  const results: PlayedNote[] = [];

  for (const frame of frames) {
    for (let c = 0; c < beatmap.keys; c++) {
      const col = columns[c];
      const missedNote = col.onFrame(frame.time);
      if (missedNote) {
        results.push(missedNote);
      }

      const action = frame.actions[c];
      const playedNote = col.onAction(frame.time, action);
      if (playedNote) {
        results.push(playedNote);
      }
    }
  }
  return results;
}