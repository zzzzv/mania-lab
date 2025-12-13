import Konva from 'konva';
import type { Beatmap, Note } from '~/lib/mania-replay/src';

export type noteColorSelector = (keys: number, object: Note) => string;
export type Element = Konva.Group | Konva.Shape;
export type elementCreator<T> = (ctx: Context, object: T) => Element;
export type formatter<T> = (data: T) => string;

export const defaultOptions = {
  background: {
    /** Whether to render background */
    enabled: true,
    /** Background color */
    color: '#000000', // black
    /** Custom function to create background element */
    createElement: undefined as elementCreator<void> | undefined,
  },
  note: {
    /** Width of each column in px */
    width: 40 as 'auto' | number,
    /** Height of regular notes in px */
    height: 12,
    /** Corner radius in px */
    rx: 2,
    /** Custom function to select note colors */
    selectColor: undefined as noteColorSelector | undefined,
    /** Custom function to create note elements */
    createElement: undefined as elementCreator<Note> | undefined,
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
      max: 10000, // ms
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
  stage: {
    /** Width of the stage in px */
    width: 'auto' as 'auto' | number,
    /** Height of the stage in px */
    height: 930,
  }
}

export type Options = typeof defaultOptions;

export function resolveOptions(beatmap: Beatmap, options: Options) {
  if (options.note.width === 'auto' && options.stage.width === 'auto') {
    throw new Error('Cannot set both note.width and stage.width to "auto"');
  }

  const lastEnd = beatmap.notes.reduce((max, note) => Math.max(max, note.end ?? note.start), 0);
  const beatmapDuration = Math.ceil(lastEnd / 1000) * 1000;

  const noteWidth = options.note.width === 'auto'
    ? ((options.stage.width as number) - options.scroll.width - options.axis.width) / beatmap.keys
    : options.note.width;
  const stageWidth = options.stage.width === 'auto'
    ? beatmap.keys * (options.note.width as number) + options.scroll.width + options.axis.width
    : options.stage.width;

  const listeners: Array<() => void> = [];

  const state = {
    startTime: 0,
    endTime: options.scroll.window.default,
    onChange: {
      emit: () => listeners.forEach(fn => fn()),
      subscribe: (fn: () => void) => {
        listeners.push(fn);
        return () => {
          const idx = listeners.indexOf(fn);
          if (idx >= 0) listeners.splice(idx, 1);
        };
      },
    },
  }
  
  return {
    beatmap: {
      ...beatmap,
      duration: beatmapDuration,
    },
    ...options,
    note: {
      ...options.note,
      width: noteWidth,
    },
    scroll: {
      ...options.scroll,
      x: scrollX,
    },
    stage: {
      ...options.stage,
      width: stageWidth,
    },
    state,
  }
}

export type Context = ReturnType<typeof resolveOptions>;