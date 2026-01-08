import Konva from 'konva';
import type { Note, TimingPoint, ReplayFrame, PlayedNote } from '~/lib/mania-replay/src';
import { osuV1 } from '~/lib/mania-replay/src';
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
  ctx.replay.createElement ??= createKeyAction;
  const notes = createNotes(ctx);
  layer.add(notes);

  if (ctx.replay.useFrameActions) {
    const keyActions = createFrameKeyActions(ctx);
    layer.add(keyActions);
  }

  ctx.axis.createElement ??= createAxisLabel;
  const axisLabels = createAxisLabels(ctx);
  layer.add(axisLabels);

  layer.batchDraw();
}

function translateTime(ctx: Context, time: number) {
  const scale = ctx.canvas.height / (ctx.state.endTime - ctx.state.startTime);
  return ctx.canvas.height - (time - ctx.state.startTime) * scale;
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
    points: [0, y, ctx.canvas.width - ctx.scroll.width - ctx.axis.width, y],
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

function createNote(ctx: Context, note: PlayedNote) {
  const x = note.column * ctx.note.width;
  const y = translateTime(ctx, note.start);
  const color = ctx.note.selectColor!(ctx.beatmap.keys, note);

  const group = new Konva.Group();
  const head = new Konva.Rect({
    x,
    y: y - ctx.note.height / 2,
    width: ctx.note.width,
    height: ctx.note.height,
    fill: color,
    cornerRadius: ctx.note.rx,
  });
  
  const getData = () => ({
    name: 'Note',
    start: note.start,
    end: note.end,
    result: note.result !== -1 ? osuV1.nameTable[note.result] : undefined,
    actions: note.actions.length > 0 ? note.actions : undefined,
  });
  head.setAttr('getData', getData);
  group.add(head);

  if (note.end) {
    const topY = translateTime(ctx, note.end);
    const body = new Konva.Rect({
      x: x + (ctx.note.width - ctx.note.bodyWidth) / 2,
      y: topY,
      width: ctx.note.bodyWidth,
      height: y - topY - ctx.note.height / 2,
      fill: ctx.note.bodyColor ?? color,
    });
    group.add(body);
    body.setAttr('getData', getData);
  }

  return group;
}

function createNotes(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.scroll.width,
    y: 0,
  });
  const noteHeightTimeOffset = (ctx.note.height / ctx.canvas.height) * (ctx.state.endTime - ctx.state.startTime);
  for (const note of ctx.beatmap.notes) {
    const end = note.end ?? note.start + noteHeightTimeOffset;
    if (note.start > ctx.state.endTime || end < ctx.state.startTime) {
      continue;
    }
    group.add(createNote(ctx, note));
  }
  if (ctx.replay.useFrameActions) return group;

  for (const note of ctx.beatmap.notes) {
    if (ctx.replay.selectLevels.includes(note.result)) {
      if (note.actions.length === 0) {
        group.add(createMissAction(ctx, note));
      } else {
        for (let i = 0; i < note.actions.length; i += 2) {
          const action = {
            column: note.column,
            start: note.actions[i],
            end: i + 1 < note.actions.length
              ? note.actions[i + 1]
              : undefined,
          };
          group.add(createKeyAction(ctx, action));
        }
      }
    }
  }
  return group;
}

function createMissAction(ctx: Context, note: PlayedNote) {
  const midTime = note.end ? (note.start + note.end) / 2 : note.start;
  const text = new Konva.Text({
    text: 'X',
    x: note.column * ctx.note.width + ctx.note.width / 2,
    y: translateTime(ctx, midTime),
    fontSize: ctx.note.bodyWidth,
    fontStyle: 'bold',
    fill: ctx.replay.color,
  });
  text.offsetX(text.width() / 2);
  text.offsetY(text.height() / 2);
  return text;
}

function *generateActionsFromFrame(replay: ReplayFrame[]): Generator<KeyAction> {
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

  const lines = [[x + grid, pressY, x + grid * 3, pressY]];
  if (action.end) {
    const releaseY = translateTime(ctx, action.end);
    lines.push([x + grid * 2, pressY, x + grid * 2, releaseY]);
  }

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

function createFrameKeyActions(ctx: Context) {
  const group = new Konva.Group({
    x: ctx.scroll.width,
    y: 0,
  });
  if (ctx.replay.frames.length === 0) {
    return group;
  }
  for (const action of generateActionsFromFrame(ctx.replay.frames)) {
    const end = action.end ?? action.start;
    if (end < ctx.state.startTime || action.start > ctx.state.endTime) {
      continue;
    }
    group.add(createKeyAction(ctx, action));
  }
  return group;
}