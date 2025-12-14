import type { Beatmap, Note, ReplayFrame, HitResult, PlayedNote } from './types';
import { createQueues, generateActions } from './utils';
import type { NoteQueue } from './utils';

export const accuracy = [1.0, 1.0, 2/3, 1/3, 1/6, 0.0] as const;
export const levelNames = ['Perfect', 'Great', 'Good', 'Ok', 'Meh', 'Miss'] as const;

export class HitWindows {
  private windows: number[];
  private lnWindows: number[];

  constructor(od: number, mod: 'nm'|'ez'|'hr' = 'nm') {
    const createWindows = (): number[] => {
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
    this.windows = createWindows();
    this.lnWindows = createWindows();
    this.lnWindows[0] *= 1.2;
    this.lnWindows[1] *= 1.1;
  }

  getHitLevel(offset: number): number | null {
    for (let i = 0; i < 3; i++) {
      if (offset >= -this.windows[i] && offset <= this.windows[i]) {
        return i;
      }
    }
    for (let i = 3; i < this.windows.length; i++) {
      if (offset >= -this.windows[i] && offset <= this.windows[3] - 1) {
        return i;
      }
    }
    return null;
  }

  hitMiss(offset: number): boolean {
    return offset > this.windows[3] - 1;
  }

  getHeadLevel(offset: number): number | null {
    for (let i = 0; i < 3; i++) {
      if (offset >= -this.lnWindows[i] && offset <= this.lnWindows[i]) {
        return i;
      }
    }
    for (let i = 3; i < this.lnWindows.length; i++) {
      if (offset >= -this.lnWindows[i] && offset <= this.lnWindows[3] - 1) {
        return i;
      }
    }
    return null;
  }

  headMiss(offset: number): boolean {
    return offset > this.lnWindows[3] - 1;
  }

  getReleaseLevel(headOffset: number, tailOffset: number): number | null {
    if (tailOffset < -this.lnWindows[4]) {
      return this.missLevel;
    }

    tailOffset = Math.min(tailOffset, this.lnWindows[4]);
    const meanOffset = (Math.abs(headOffset) + Math.abs(tailOffset)) / 2;
    if (meanOffset > this.lnWindows[this.missLevel]) {
      return this.missLevel;
    }

    for (let i = 0; i < this.lnWindows.length; i++) {
      if (headOffset >= -this.lnWindows[i] && headOffset <= this.lnWindows[i] &&
          meanOffset <= this.lnWindows[i]) {
        return i;
      }
    }
    return null;
  }

  get missLevel(): number {
    return this.windows.length - 1;
  }
}

export class Column {
  private queue: NoteQueue;
  private slot: Note = {column: 0, start: 0};
  private isProcessed: boolean = true;
  private lnHeadOffset: number | null = null;
  private windows: HitWindows;

  constructor(queue: NoteQueue, windows: HitWindows) {
    this.queue = queue;
    this.windows = windows;
  }

  tryNext(currentTime: number): void {
    if (this.isProcessed && currentTime >= this.slot.start && this.queue.peek()) {
      this.slot = this.queue.pop()!;
      this.isProcessed = false;
      this.lnHeadOffset = null;
    }
  }

  checkMiss(currentTime: number): PlayedNote | null {
    if (this.isProcessed) return null;

    const offset = currentTime - this.slot.start;
    if (this.slot.end) {
      if (!this.lnHeadOffset && this.windows.headMiss(offset)) {
        const result = {
          time: currentTime,
          level: this.windows.missLevel,
          offset,
          acc: 0.0,
        };
        return this.finalize(result);
      }
    } else {
      if (this.windows.hitMiss(offset)) {
        const result = {
          time: currentTime,
          level: this.windows.missLevel,
          offset,
          acc: 0.0,
        };
        return this.finalize(result);
      }
    }
    return null;
  }

  checkHit(currentTime: number): PlayedNote | null {
    if (this.isProcessed) return null;

    const offset = currentTime - this.slot.start;
    if (this.slot.end) {
      const level = this.windows.getHeadLevel(offset);
      if (level !== null) {
        if (level === this.windows.missLevel) {
          const result = {
            time: currentTime,
            level,
            offset,
            acc: 0.0,
          };
          return this.finalize(result);
        } else {
          this.lnHeadOffset = offset;
        }
      }
    } else {
      const level = this.windows.getHitLevel(offset);
      if (level !== null) {
        const result = {
          time: currentTime,
          level,
          offset,
          combo: level < this.windows.missLevel ? 1 : undefined,
          acc: accuracy[level],
        };
        return this.finalize(result);
      }
    }
    return null;
  }

  checkRelease(currentTime: number): PlayedNote | null {
    if (this.isProcessed || this.slot.end === undefined || this.lnHeadOffset === null) return null;

    const offset = currentTime - this.slot.end;
    const level = this.windows.getReleaseLevel(this.lnHeadOffset, offset);
    if (level !== null) {
      const result = {
        time: currentTime,
        level,
        offset: this.lnHeadOffset,
        releaseOffset: offset,
        combo: level < this.windows.missLevel ? 1 : undefined,
        acc: accuracy[level],
      };
      return this.finalize(result);
    }
    return null;
  }

  private finalize(result: HitResult): PlayedNote {
    this.isProcessed = true;
    return { ...this.slot, result };
  }
}

export class OsuPlayer {
  private beatmap: Beatmap;
  private replayFrames: ReplayFrame[];

  constructor(beatmap: Beatmap, replayFrames: ReplayFrame[]) {
    this.beatmap = beatmap;
    this.replayFrames = replayFrames;
  }

  play(resolution: 'ms' | 'replay' = 'replay'): PlayedNote[] {
    const results: PlayedNote[] = [];
    const queues = createQueues(this.beatmap);
    const windows = new HitWindows(this.beatmap.od);
    const columns = queues.map(q => new Column(q, windows));
    const frames = generateActions(this.replayFrames, resolution);

    for (const frame of frames) {
      for (let c = 0; c < this.beatmap.keys; c++) {
        const col = columns[c];
        const result = col.checkMiss(frame.time);
        if (result) {
          results.push(result);
        }
        col.tryNext(frame.time);
      }
      for (let c = 0; c < this.beatmap.keys; c++) {
        const col = columns[c];
        const action = frame.actions[c];
        let note: PlayedNote | null = null;
        switch (action) {
          case 'press':
            note = col.checkHit(frame.time);
            break;
          case 'release':
            note = col.checkRelease(frame.time);
            break;
        }
        if (note) {
          results.push(note);
        }
        col.tryNext(frame.time);
      }
    }
    return results;
  }
}
