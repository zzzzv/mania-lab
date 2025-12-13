export interface Note {
  /** Column index (0-based) */
  column: number;
  /** Start time in milliseconds */
  start: number;
  /** End time in milliseconds, optional for hold notes */
  end?: number;
}

export interface TimingPoint {
  /** Time in milliseconds */
  time: number;
  /** Beats per minute */
  bpm: number;
  /** Time signature numerator (meter) */
  meter: number;
}

export interface Beatmap {
  /** Number of columns (keys) */
  keys: number;
  /** Overall Difficulty */
  od: number;
  /** Note objects */
  notes: Note[];
  /** Timing points */
  timingPoints: TimingPoint[];
}

export interface ReplayFrame {
  time: number,
  keyStates: boolean[],
}

export interface Result {
  time: number,
  level: number,
  offset: number,
  releaseOffset?: number,
  note: Note,
  combo?: number,
  acc: number,
}