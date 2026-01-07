import Konva from 'konva';
import type { Note, PlayedNote, ReplayFrame, TimingPoint } from '~/lib/mania-replay/src';
import { osuV1, type Mod } from '~/lib/mania-replay/src';
import { createEvent } from '../mania-panel/utils';

export type noteColorSelector = (keys: number, object: Note) => string;
export type Element = Konva.Group | Konva.Shape;
export type elementCreator<T> = (ctx: Context, object: T) => Element;
export type formatter<T> = (data: T) => string;
export type KeyAction = Note

export function createDefaultOptions() {
  return {
    canvas: {
      /** Total width of the canvas in px */
      width: 'auto' as 'auto' | number,
      /** Total height of the canvas in px */
      height: 930,
    },
    background: {
      /** Whether to render background */
      enabled: true,
      /** Background color */
      color: '#000000', // black
      /** Custom function to create background element */
      createElement: undefined as elementCreator<void> | undefined,
    },
    beatmap: {
      /** Number of columns (keys) */
      keys: 7,
      /** Overall Difficulty */
      od: 8,
      /** Duration of the beatmap in milliseconds */
      duration: 'auto' as 'auto' | number,
      /** Note objects */
      notes: [] as Note[],
      /** Timing points */
      timingPoints: [] as TimingPoint[],
    },
    note: {
      /** Width of each column in px */
      width: 40 as 'auto' | number,
      /** Height of regular notes in px */
      height: 12,
      /** Corner radius in px */
      rx: 2,
      /** Width of long note body in px */
      bodyWidth: 20,
      /** Color of the long note body */
      bodyColor: '#CCCCCC' as string | undefined,
      /** Custom function to select note colors */
      selectColor: undefined as noteColorSelector | undefined,
      /** Custom function to create note elements */
      createElement: undefined as elementCreator<PlayedNote> | undefined,
    },
    replay: {
      /** Color of the replay cursor */
      color: '#FF0000', // red
      /** Width of the replay cursor in px */
      width: 4,
      /** Replay frames */
      frames: [] as ReplayFrame[],
      /** Mod applied to the replay */
      mod: 'nm' as Mod,
      /** Levels to render from note results */
      selectLevels: [0, 1, 2, 3, 4, 5],
      /** Render key action from replay frames rather than notes result */
      useFrameActions: false,
      /** Custom function to create replay cursor element */
      createElement: undefined as elementCreator<KeyAction> | undefined,
    },
    barline: {
      /** Stroke width of bar lines in px */
      strokeWidth: 1,
      /** Color of the bar lines */
      color: '#85F000', // green
      /** Custom function to create bar line elements */
      createElement: undefined as elementCreator<number> | undefined,
    },
    axis: {
      /** Width of the axis area in px */
      width: 30,
      /** Style for labels at whole minutes (e.g., 1:00, 2:00) */
      minute: {
        color: '#FF3F00',
        strokeWidth: 2,
        fontSize: 18,
      },
      /** Style for second labels */
      second: {
        color: '#FFFFFF',
        strokeWidth: 1,
        fontSize: 18,
      },
      /** Custom function to create axis elements */
      createElement: undefined as elementCreator<number> | undefined,
    },
    scroll: {
      /** Width of the scrollbar in px */
      width: 80,
      /** Time window for the scrollbar in milliseconds */
      window: {
        min: 2000, // ms
        max: 20000, // ms
        default: 5000, // ms
      },
      /** NPS (notes-per-second) histogram rendered as the scrollbar background */
      nps: {
        /** Whether to count note tails in NPS calculation */
        countTails: true,
        /** Color of the NPS bars */
        color: '#FF99CC',
        /** Custom function to create scrollbar background elements */
        createElement: undefined as elementCreator<void> | undefined,
      },
    },
    tooltip: {
      /** Whether to show tooltips on notes */
      enabled: true,
      /** Custom function to format tooltip text */
      format: undefined as formatter<any> | undefined,
    },
  };
}

export type Options = ReturnType<typeof createDefaultOptions>;

export function resolveOptions(options: Options) {
  if (options.note.width === 'auto' && options.canvas.width === 'auto') {
    throw new Error('Cannot set both note.width and stage.width to "auto"');
  }
  let notes: PlayedNote[] = options.beatmap.notes.map(n => ({
    ...n,
    result: -1,
    actions: [] as number[],
  }));
  let duration = 60000;
  if (notes.length > 0) {
    const lastEnd = notes.reduce((max, note) => Math.max(max, note.end ?? note.start), 0);
    duration = Math.ceil(lastEnd / 1000) * 1000;

    if (options.replay.frames.length > 0) {
      notes = osuV1.play(options.beatmap, options.replay.frames, options.replay.mod);
    }
  }

  const noteWidth = options.note.width === 'auto'
    ? ((options.canvas.width as number) - options.scroll.width - options.axis.width) / options.beatmap.keys
    : options.note.width;
  const stageWidth = options.canvas.width === 'auto'
    ? options.beatmap.keys * (options.note.width as number) + options.scroll.width + options.axis.width
    : options.canvas.width;

  const state = {
    startTime: 0,
    endTime: options.scroll.window.default,
    onChange: createEvent(),
  }
  
  return {
    ...options,
    canvas: {
      ...options.canvas,
      width: stageWidth,
    },
    beatmap: {
      ...options.beatmap,
      notes,
      duration: duration,
    },
    note: {
      ...options.note,
      width: noteWidth,
    },
    state,
  }
}

export type Context = ReturnType<typeof resolveOptions>;