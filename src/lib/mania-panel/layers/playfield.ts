import Konva from 'konva';
import type { Beatmap, Note, TimingPoint } from '~/lib/mania-replay/src';
import type { Context } from '../options';

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

export function renderPlayfield(ctx: Context, layer: Konva.Layer) {
  layer.destroyChildren();

  ctx.barline.createElement ??= createBarLines;
  const barLines = createBarLines(ctx);
  layer.add(barLines);

  ctx.note.selectColor ??= createNoteColorSelector();
  ctx.note.createElement ??= createNotes;
  const notes = createNotes(ctx);
  layer.add(notes);

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
    points: [0, y, ctx.stage.width - ctx.scroll.width, y],
    stroke: ctx.barline.color,
    strokeWidth: ctx.barline.strokeWidth,
  });
  return line;
}

function createBarLines(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.playField.x,
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

function createNote(ctx: Context, note: Note) {
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
  return rect;
}

function createNotes(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.playField.x,
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