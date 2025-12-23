import type { Beatmap, Note, ReplayFrame, PlayedNote } from './types';
import { createQueues, generateActions } from './utils';
import type { NoteQueue, Action } from './utils';

export const levelAccuracies = [1.0, 1.0, 2/3, 1/3, 1/6, 0.0] as const;
export const levelNames = ['Perfect', 'Great', 'Good', 'Ok', 'Meh', 'Miss'] as const;

function createWindows(od: number, mod: 'nm'|'ez'|'hr' = 'nm'): number[] {
  const baseWindows = [
    16,
    64 - 3 * od,
    97 - 3 * od,
    127 - 3 * od,
    151 - 3 * od,
    188 - 3 * od,
  ];
  const modFactor = mod === 'ez' ? 1.4 : mod === 'hr' ? 1/1.4 : 1.0;
  return baseWindows.map(w => w * modFactor);
};

function toLNWindows(windows: Readonly<number[]>) {
  return windows.map((w, i) => i === 0 ? w * 1.2 : i === 1 ? w * 1.1 : w);
};

function getLevel(offset: number, windows: Readonly<number[]>) {
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
    level: -1,
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
      if (playedNote.level < 0) {
        playedNote.level = 5;
      }
      return playedNote;
    }
  };

  const onHit = (time: number) => {
    if (isProcessed) return;
    
    if (note.end === undefined) {
      let level = getLevel(time - note.start, windows);
      if (level !== null) {
        isProcessed = true;
        playedNote.level = level;
        playedNote.actions.push(time);
        return playedNote;
      }
    } else if (time >= note.start - windows[5] && time <= note.end + windows[3] - 1) {
      headTime = time < note.start - windows[4] ? note.end - 1 : time;
      playedNote.actions.push(time);
    }
  };

  const _getLNLevel = (tailOffset: number) => {
    if (tailOffset < -windows[4]) return 5;

    const headLevel = getLevel(headTime! - note.start, windows) ?? 4;
    const meanOffset = (Math.abs(headTime! - note.start) + Math.abs(tailOffset)) / 2;
    const level = getLevel(meanOffset, windows) ?? 4;
    return Math.max(headLevel, level, dropped ? 2 : 0);
  };

  const onRelease = (time: number) => {
    if (note.end === undefined || isProcessed || headTime === null) return;

    const offset = time - note.end;
    if (offset < -windows[4]) {
      playedNote.level = _getLNLevel(offset);
      playedNote.actions.push(time);
      dropped = true;
      headTime = null;
      return;
    }

    isProcessed = true;
    const level = _getLNLevel(offset);
    playedNote.level = level;
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

export function play(beatmap: Beatmap, replayFrames: ReplayFrame[], resolution: 'ms' | 'replay' = 'replay'): PlayedNote[] {
  const queues = createQueues(beatmap);
  const windows = createWindows(beatmap.od);
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