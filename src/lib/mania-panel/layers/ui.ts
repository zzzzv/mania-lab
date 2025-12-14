import Konva from 'konva';
import type { Context } from '../options';
import { clamp } from '../utils';

export function render(ctx: Context, layer: Konva.Layer) {
  layer.destroyChildren();

  if (ctx.background.enabled) {
    ctx.background.createElement ??= createBackground;
    const bg = ctx.background.createElement(ctx);
    layer.add(bg);
  }

  ctx.scroll.nps.createElement ??= createScrollNps;
  const scrollNps = ctx.scroll.nps.createElement(ctx);
  layer.add(scrollNps);

  const scrollWindow = createScrollWindow(ctx);
  layer.add(scrollWindow);

  layer.batchDraw();
}

export function createBackground(ctx: Context) {
  const bg = new Konva.Rect({
    x: 0,
    y: 0,
    width: ctx.stage.width,
    height: ctx.stage.height,
    fill: ctx.background.color,
  });
  return bg;
}


function getNps(beatmap: Context['beatmap'], countTails = false) {
  const nps: number[] = Array.from({ length: beatmap.duration / 1000 }, () => 0);
  for (const note of beatmap.notes) {
    nps[Math.floor(note.start / 1000)]++;
    if (countTails && note.end !== undefined) {
      nps[Math.floor(note.end / 1000)]++;
    }
  }
  return nps;
}

export function createScrollNps(ctx: Context) {
  const nps = getNps(ctx.beatmap, ctx.scroll.nps.countTails);
  const maxNps = Math.max(...nps);
  const barHeight = ctx.stage.height / nps.length;
  const group = new Konva.Group({
    x: ctx.scroll.x,
    y: 0,
  });
  for (let i = 0; i < nps.length; i++) {
    const barWidth = (nps[i] / maxNps) * ctx.scroll.width;
    const rect = new Konva.Rect({
      x: ctx.scroll.width - barWidth,
      y: ctx.stage.height - barHeight * (i + 1) + 1,
      width: barWidth,
      height: barHeight - 2,
      fill: ctx.scroll.nps.color,
    });
    rect.setAttr('getData', () => ({
      name: 'NPS',
      time: i * 1000,
      nps: nps[i]
    }));
    group.add(rect);
  }
  return group;
}

function translateState(ctx: Context) {
  const visibleDuration = ctx.state.endTime - ctx.state.startTime;
  const height = ctx.stage.height * (visibleDuration / ctx.beatmap.duration);
  const bottomY = ctx.stage.height - (ctx.state.startTime / ctx.beatmap.duration) * ctx.stage.height;
  const topY = bottomY - height;
  return { topY, bottomY, height };
}

function updateState(ctx: Context, topY: number, bottomY: number) {
  const visibleDuration = ctx.beatmap.duration * (bottomY - topY) / ctx.stage.height;
  const startTime = ctx.beatmap.duration * (ctx.stage.height - bottomY) / ctx.stage.height;
  ctx.state.startTime = startTime;
  ctx.state.endTime = startTime + visibleDuration;
  ctx.state.onChange.emit();
}

export function createScrollWindow(ctx: Context) {
  const init = translateState(ctx);
  const minHeight = ctx.stage.height * (ctx.scroll.window.min / ctx.beatmap.duration);
  const maxHeight = ctx.stage.height * (ctx.scroll.window.max / ctx.beatmap.duration);
  const handleSize = 10;
  
  const group = new Konva.Group({
    x: ctx.scroll.x,
    y: 0,
  });
  
  const rect = new Konva.Rect({
    x: 0,
    y: init.topY,
    width: ctx.scroll.width,
    height: init.height,
    fill: 'rgba(255, 255, 255, 0.2)',
    stroke: '#FFFFFF',
    strokeWidth: 2,
    draggable: true,
    dragBoundFunc: function(pos) {
      return {
        x: this.absolutePosition().x,
        y: clamp(pos.y, 0, ctx.stage.height - this.height()),
      };
    },
  });
  rect.setAttr('getData', () => ({
    name: 'Window',
    start: Math.round(ctx.state.startTime),
    end: Math.round(ctx.state.endTime),
  }));

  const topHandle = new Konva.Rect({
    x: 0,
    y: init.topY - handleSize / 2,
    width: ctx.scroll.width,
    height: handleSize,
    fill: 'rgba(255, 255, 255, 0.5)',
    draggable: true,
    dragBoundFunc: function(pos) {
      const bottom = rect.y() + rect.height();
      const newTop = clamp(pos.y + handleSize / 2, bottom - maxHeight, bottom - minHeight);
      return {
        x: this.absolutePosition().x,
        y: Math.max(newTop, 0) - handleSize / 2,
      };
    },
  });

  const bottomHandle = new Konva.Rect({
    x: 0,
    y: init.bottomY - handleSize / 2,
    width: ctx.scroll.width,
    height: handleSize,
    fill: 'rgba(255, 255, 255, 0.5)',
    draggable: true,
    dragBoundFunc: function(pos) {
      const top = rect.y();
      const newBottom = clamp(pos.y + handleSize / 2, top + minHeight, top + maxHeight);
      return {
        x: this.absolutePosition().x,
        y: Math.min(newBottom, ctx.stage.height) - handleSize / 2,
      };
    },
  });

  topHandle.on('dragmove', () => {
    const newTopY = topHandle.y() + handleSize / 2;
    const bottomY = rect.y() + rect.height();
    const newHeight = bottomY - newTopY;
    rect.y(newTopY);
    rect.height(newHeight);
    updateState(ctx, newTopY, bottomY);
  });

  bottomHandle.on('dragmove', () => {
    const newBottomY = bottomHandle.y() + handleSize / 2;
    const newTopY = rect.y();
    const newHeight = newBottomY - newTopY;
    rect.height(newHeight);
    updateState(ctx, newTopY, newBottomY);
  });

  rect.on('dragmove', () => {
    const newTopY = rect.y();
    const newBottomY = newTopY + rect.height();
    topHandle.y(newTopY - handleSize / 2);
    bottomHandle.y(newBottomY - handleSize / 2);
    updateState(ctx, newTopY, newBottomY);
  });

  topHandle.on('mouseenter', () => {
    document.body.style.cursor = 'ns-resize';
  });
  topHandle.on('mouseleave', () => {
    document.body.style.cursor = 'default';
  });
  bottomHandle.on('mouseenter', () => {
    document.body.style.cursor = 'ns-resize';
  });
  bottomHandle.on('mouseleave', () => {
    document.body.style.cursor = 'default';
  });
  rect.on('mouseenter', () => {
    document.body.style.cursor = 'move';
  });
  rect.on('mouseleave', () => {
    document.body.style.cursor = 'default';
  });

  group.add(rect);
  group.add(topHandle);
  group.add(bottomHandle);

  return group;
}
