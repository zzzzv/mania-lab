import type { Beatmap, Note, ReplayFrame, Mod } from './types';
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

export type PlayedNote = Note & {
  result: {
    time: number,
    level: number,
  }
  actions: number[],
};

function createJudgement(note: Readonly<Note>, baseWindows: Readonly<number[]>) {
  const playedNote: PlayedNote = {
    ...note,
    result: { time: 0, level: 5 },
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
      playedNote.result.time = time;
      return playedNote;
    }
  };

  const onHit = (time: number) => {
    if (isProcessed) return;
    
    if (note.end === undefined) {
      let level = getLevel(time - note.start, windows);
      if (level !== null) {
        isProcessed = true;
        playedNote.result = { time, level };
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
    const clipTailOffset = Math.min(tailOffset, windows[4]);
    const meanOffset = (Math.abs(headTime! - note.start) + Math.abs(clipTailOffset)) / 2;
    const level = getLevel(meanOffset, windows) ?? 4;
    return Math.max(headLevel, level, dropped ? 2 : 0);
  };

  const onRelease = (time: number) => {
    if (note.end === undefined || isProcessed || headTime === null) return;

    const offset = time - note.end;
    const level = _getLNLevel(offset);
    playedNote.result = { time, level };
    playedNote.actions.push(time);

    if (offset < -windows[4]) {
      dropped = true;
      headTime = null;
      return;
    } else {
      isProcessed = true;
      return playedNote;
    }
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
) {
  const queues = createQueues(beatmap);
  const windows = createWindows(beatmap.od, mod);
  const columns = queues.map(q => createColumn(q, windows));
  const frames = generateActions(replayFrames, resolution);

  const playedNotes: PlayedNote[] = [];

  for (const frame of frames) {
    for (let c = 0; c < beatmap.keys; c++) {
      const col = columns[c];
      const missedNote = col.onFrame(frame.time);
      if (missedNote) {
        playedNotes.push(missedNote);
      }

      const action = frame.actions[c];
      const playedNote = col.onAction(frame.time, action);
      if (playedNote) {
        playedNotes.push(playedNote);
      }
    }
  }
  return {
    method: 'osu-v1' as const,
    notes: playedNotes,
    accTable,
    nameTable,
  }
}

export type PlayResult = ReturnType<typeof play>;

export function countResults(playResult: PlayResult) {
  const counts = playResult.nameTable.map(() => 0);
  for (const note of playResult.notes) {
    counts[note.result.level]++;
  }
  return counts;
}

export function calcAccuracy(playResult: PlayResult) {
  const totalHits = playResult.notes.length;
  if (totalHits === 0) return 0;
  const totalAcc = playResult.notes.reduce(
    (sum, note) => sum + playResult.accTable[note.result.level],
    0
  );
  return totalAcc / totalHits;
}

export function calcMaxCombo(playResult: PlayResult) {
  const sorted = playResult.notes.slice().sort((a, b) => a.result.time - b.result.time);
  let maxCombo = 0;
  let currentCombo = 0;
  for (const note of sorted) {
    if (note.result.level < playResult.accTable.length - 1) {
      currentCombo += 1;
      if (currentCombo > maxCombo) {
        maxCombo = currentCombo;
      }
    } else {
      currentCombo = 0;
    }
  }
  return maxCombo;
}

export function summarize(playResult: PlayResult) {
  return {
    counts: countResults(playResult),
    totalHits: playResult.notes.length,
    accuracy: calcAccuracy(playResult),
    maxCombo: calcMaxCombo(playResult),
  };
}
