import type { Beatmap, Note, ReplayFrame } from './types';

export interface NoteQueue {
  peek(): Note | null;
  pop(): Note | null;
}

export function createQueues(beatmap: Beatmap): NoteQueue[] {
  const sortedNotes = beatmap.notes.sort((a, b) => a.start - b.start);
  const columns: Note[][] = Array.from({ length: beatmap.keys }, () => []);
  for (const note of sortedNotes) {
    columns[note.column].push(note);
  }
  const offsets = columns.map(() => 0);

  const makeQueue = (col: number): NoteQueue => ({
    peek: () => {
      return offsets[col] < columns[col].length ? columns[col][offsets[col]] : null;
    },
    pop: () => {
      if (offsets[col] < columns[col].length) {
        const note = columns[col][offsets[col]];
        offsets[col]++;
        return note;
      }
      return null;
    },
  });

  return columns.map((_, i) => makeQueue(i));
}

export type Action = 'none' | 'press' | 'hold' | 'release';

export interface ActionFrame {
  time: number;
  actions: Action[];
}

function *generateFramesByMs(frames: ReplayFrame[]): Generator<ReplayFrame> {
  if (frames.length === 0) return;
  
  const keys = frames[0].keyStates.length;
  let lastStates = Array.from({ length: keys }, () => false);
  let currentTime = frames[0].time;
  let frameIndex = 0;

  while (frameIndex < frames.length) {
    const frame = frames[frameIndex];
    if (frame.time > currentTime) {
      yield {
        time: currentTime,
        keyStates: lastStates,
      };
      currentTime++;
    } else {
      yield frame;
      lastStates = frame.keyStates;
      frameIndex++;
    }
  }
}

export function *generateActions(frames: ReplayFrame[], resolution: 'ms' | 'replay' = 'replay'): Generator<ActionFrame> {
  const keys = frames[0].keyStates.length;
  const iter = resolution === 'ms' ? generateFramesByMs(frames) : frames;
  let lastStates = Array.from({ length: keys }, () => false);

  for (const frame of iter) {
    const actionFrame = {
      time: frame.time,
      actions: [] as Action[]
    };
    for (let i = 0; i < keys; i++) {
      const action = lastStates[i]
        ? (frame.keyStates[i] ? 'hold' : 'release')
        : (frame.keyStates[i] ? 'press' : 'none');
      actionFrame.actions.push(action);
    }
    lastStates = frame.keyStates;
    yield actionFrame;
  }
}