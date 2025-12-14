import Konva from 'konva';
import type { Note, TimingPoint, ReplayFrame, PlayedNote } from '~/lib/mania-replay/src';
import { levelNames } from '~/lib/mania-replay/src';
import type { Context, KeyAction } from '../options';

export const presetColorSchemes = [
  '#FFFFFF',
  '#5EAEFF',
  '#FFEC5E',
  '#FF3F00',
];

export const presetKeyLayouts = {
  1: [0],
  2: [0, 0],
  3: [0, 1, 0],
  4: [0, 1, 1, 0],
  5: [0, 1, 2, 1, 0],
  6: [0, 1, 0, 0, 1, 0],
  7: [0, 1, 0, 2, 0, 1, 0],
  8: [0, 1, 0, 2, 2, 0, 1, 0],
  9: [3, 0, 1, 0, 2, 0, 1, 0, 3],
  10: [3, 0, 1, 0, 2, 2, 0, 1, 0, 3],
  12: [3, 1, 0, 1, 0, 2, 2, 0, 1, 0, 1, 3],
  14: [3, 0, 1, 0, 1, 0, 2, 2, 0, 1, 0, 1, 0, 3],
  16: [3, 1, 0, 1, 0, 1, 0, 2, 2, 0, 1, 0, 1, 0, 1, 3],
  18: [3, 0, 1, 0, 1, 0, 1, 0, 2, 2, 0, 1, 0, 1, 0, 1, 0, 3],
};

export function createNoteColorSelector(
  colors: readonly string[] = presetColorSchemes,
  layouts: Readonly<Record<number, readonly number[]>> = presetKeyLayouts
) {
  return (keys: number, object: Note) => {
    const layout = layouts[keys];
    if (!layout) {
      throw new Error(`Unsupported keys: ${keys}`);
    }
    const colorKey = layout[object.column];
    if (colorKey === undefined) {
      throw new Error(`Invalid column: ${object.column} for ${keys}K`);
    }
    return colors[colorKey];
  };
}

export function render(ctx: Context, layer: Konva.Layer) {
  layer.destroyChildren();

  ctx.barline.createElement ??= createBarLine;
  const barLines = createBarLines(ctx);
  layer.add(barLines);

  ctx.note.selectColor ??= createNoteColorSelector();
  ctx.note.createElement ??= createNote;
  const notes = createNotes(ctx);
  layer.add(notes);

  ctx.replay.createElement ??= createKeyAction;
  const keyActions = createKeyActions(ctx);
  layer.add(keyActions);

  ctx.axis.createElement ??= createAxisLabel;
  const axisLabels = createAxisLabels(ctx);
  layer.add(axisLabels);

  layer.batchDraw();
}

function translateTime(ctx: Context, time: number) {
  const scale = ctx.stage.height / (ctx.state.endTime - ctx.state.startTime);
  return ctx.stage.height - (time - ctx.state.startTime) * scale;
}

function generateBarLinePositions(
  timingPoints: readonly TimingPoint[],
  start: number,
  end: number
): number[] {
  const sorted = [...timingPoints].sort((a, b) => a.time - b.time);
  const result: number[] = [];
  
  for (let i = 0; i < sorted.length; i++) {
    const tp = sorted[i];
    const nextTime = i < sorted.length - 1 ? sorted[i + 1].time : end;
    const beatDuration = 60000 / tp.bpm;
    const barDuration = beatDuration * tp.meter;
    
    for (let currentTime = tp.time; currentTime < nextTime && currentTime <= end; currentTime += barDuration) {
      if (currentTime >= start) {
        result.push(currentTime);
      }
    }
  }
  
  return result;
}

function createBarLine(ctx: Context, time: number) {
  const y = translateTime(ctx, time);
  const line = new Konva.Line({
    points: [0, y, ctx.stage.width - ctx.scroll.width - ctx.axis.width, y],
    stroke: ctx.barline.color,
    strokeWidth: ctx.barline.strokeWidth,
  });
  return line;
}

function createBarLines(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.scroll.width,
    y: 0,
  });
  const barLinePositions = generateBarLinePositions(ctx.beatmap.timingPoints, 0, ctx.beatmap.duration);
  for (const time of barLinePositions) {
    if (time < ctx.state.startTime || time > ctx.state.endTime) {
      continue;
    }
    const barLine = createBarLine(ctx, time);
    group.add(barLine);
  }
  return group;
}

function createAxisLabel(ctx: Context, time: number) {
  const y = translateTime(ctx, time);
  const minutes = Math.floor(time / 60000);
  const seconds = Math.floor((time % 60000) / 1000);
  const style = seconds === 0 ? ctx.axis.minute : ctx.axis.second;
  const label = seconds === 0 ? `${minutes}` : `${seconds}`;

  const group = new Konva.Group();
  const line = new Konva.Line({
    points: [0, y, ctx.axis.width - style.fontSize - 8, y],
    stroke: style.color,
    strokeWidth: 1,
  });
  const text = new Konva.Text({
    x: ctx.axis.width - style.fontSize - 5,
    y: y - style.fontSize / 2,
    text: label,
    fontSize: style.fontSize,
    fill: style.color,
  });
  group.add(line);
  group.add(text);
  return group;
}

function createAxisLabels(ctx: Context) {
  const x = ctx.scroll.width + ctx.beatmap.keys * ctx.note.width;
  const group = new Konva.Group({
    x,
    y: 0,
  });
  for (let time = 1000; time < ctx.beatmap.duration; time += 1000) {
    if (time < ctx.state.startTime || time > ctx.state.endTime) {
      continue;
    }
    const label = createAxisLabel(ctx, time);
    group.add(label);
  }
  return group;
}

function createNote(ctx: Context, note: Note | PlayedNote) {
  const bottomY = translateTime(ctx, note.start);
  const topY = note.end ? translateTime(ctx, note.end) : bottomY - ctx.note.height;
  const height = bottomY - topY;
  const width = ctx.note.width;
  const x = note.column * width;
  const color = ctx.note.selectColor!(ctx.beatmap.keys, note);

  const rect = new Konva.Rect({
    x,
    y: topY,
    width,
    height,
    fill: color,
    cornerRadius: ctx.note.rx,
  });
  const result = 'result' in note ? {
    time: note.result.time,
    level: levelNames[note.result.level],
    offset: note.result.offset,
    release: note.result.releaseOffset,
  } : undefined;
  rect.setAttr('getData', () => ({
    name: 'Note',
    start: note.start,
    end: note.end,
    result,
  }));
  return rect;
}

function createNotes(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.scroll.width,
    y: 0,
  });
  const noteHeightTimeOffset = (ctx.note.height / ctx.stage.height) * (ctx.state.endTime - ctx.state.startTime);
  for (const note of ctx.beatmap.notes) {
    const end = note.end ?? note.start + noteHeightTimeOffset;
    if (note.start > ctx.state.endTime || end < ctx.state.startTime) {
      continue;
    }
    const noteShape = createNote(ctx, note);
    group.add(noteShape);
  }
  return group;
}

function *generateActions(replay: ReplayFrame[]) {
  const keys = replay[0].keyStates.length;
  const pressTimes: (number | null)[] = Array.from({ length: keys }, () => null);

  for (const frame of replay) {
    for (let i = 0; i < keys; i++) {
      const isPressed = frame.keyStates[i];
      const pressTime = pressTimes[i];
      if (isPressed && pressTime === null) {
        pressTimes[i] = frame.time;
      } else if (!isPressed && pressTime !== null) {
        pressTimes[i] = null;
        yield { column: i, start: pressTime, end: frame.time };
      }
    }
  }
}

function createKeyAction(ctx: Context, action: KeyAction) {
  const x = action.column * ctx.note.width;
  const pressY = translateTime(ctx, action.start);
  const grid = ctx.note.width / 4;
  const releaseY = translateTime(ctx, action.end);

  const lines = [
    [x + grid, pressY, x + grid * 3, pressY],
    [x + grid * 2, pressY, x + grid * 2, releaseY],
  ]

  const group = new Konva.Group();
  for (const linePoints of lines) {
    const line = new Konva.Line({
      points: linePoints,
      stroke: ctx.replay.color,
      strokeWidth: ctx.replay.width,
    });
    line.setAttr('getData', () => ({
      name: 'Key',
      start: action.start,
      end: action.end,
    }));
    group.add(line);
  }
  return group;
}

function createKeyActions(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.scroll.width,
    y: 0,
  });
  if (!ctx.replay.frames) {
    return group;
  }
  for (const action of generateActions(ctx.replay.frames)) {
    if (action.end < ctx.state.startTime || action.start > ctx.state.endTime) {
      continue;
    }
    group.add(createKeyAction(ctx, action));
  }
  return group;
}