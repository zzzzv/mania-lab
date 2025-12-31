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

  const scroll = createScrollWindow(ctx);
  layer.add(scroll.rect);

  ctx.scroll.nps.createElement ??= createScrollNps;
  const scrollNps = ctx.scroll.nps.createElement(ctx);
  layer.add(scrollNps);

  layer.add(scroll.group);

  layer.batchDraw();
}

export function createBackground(ctx: Context) {
  const bg = new Konva.Rect({
    x: 0,
    y: 0,
    width: ctx.canvas.width,
    height: ctx.canvas.height,
    fill: ctx.background.color,
    listening: false,
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
  const maxNps = Math.max(...nps, 1);
  const barHeight = ctx.canvas.height / nps.length;
  const barSpacing = Math.min(2, barHeight / 8);
  const group = new Konva.Group({
    x: 0,
    y: 0,
  });
  for (let i = 0; i < nps.length; i++) {
    const barWidth = (nps[i] / maxNps) * ctx.scroll.width;
    const rect = new Konva.Rect({
      x: ctx.scroll.width - barWidth,
      y: ctx.canvas.height - barHeight * (i + 1) + barSpacing / 2,
      width: barWidth,
      height: barHeight - barSpacing,
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
  const height = ctx.canvas.height * (visibleDuration / ctx.beatmap.duration);
  const bottomY = ctx.canvas.height - (ctx.state.startTime / ctx.beatmap.duration) * ctx.canvas.height;
  const topY = bottomY - height;
  return { topY, bottomY, height };
}

function updateState(ctx: Context, topY: number, bottomY: number) {
  const visibleDuration = ctx.beatmap.duration * (bottomY - topY) / ctx.canvas.height;
  const startTime = ctx.beatmap.duration * (ctx.canvas.height - bottomY) / ctx.canvas.height;
  ctx.state.startTime = startTime;
  ctx.state.endTime = startTime + visibleDuration;
  ctx.state.onChange.emit();
}

function createScrollWindow(ctx: Context) {
  const init = translateState(ctx);
  const minHeight = ctx.canvas.height * (ctx.scroll.window.min / ctx.beatmap.duration);
  const maxHeight = ctx.canvas.height * (ctx.scroll.window.max / ctx.beatmap.duration);
  const handleSize = 10;
  
  const group = new Konva.Group({
    x: 0,
    y: 0,
  });

  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: ctx.scroll.width,
    height: ctx.canvas.height,
    fill: 'rgba(0, 0, 0, 0)',
  });
  
  const thumb = new Konva.Rect({
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
        y: clamp(pos.y, 0, ctx.canvas.height - this.height()),
      };
    },
  });
  thumb.setAttr('getData', () => ({
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
      const bottom = thumb.y() + thumb.height();
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
      const top = thumb.y();
      const newBottom = clamp(pos.y + handleSize / 2, top + minHeight, top + maxHeight);
      return {
        x: this.absolutePosition().x,
        y: Math.min(newBottom, ctx.canvas.height) - handleSize / 2,
      };
    },
  });

  rect.on('click', () => {
    const pos = rect.getRelativePointerPosition();
    if (pos) {
      console.log(pos);
      const { height } = translateState(ctx);
      let newTopY: number;
      let newBottomY: number;
      if (pos.y < height / 2) {
        newTopY = Math.max(pos.y - height / 2, 0);
        newBottomY = newTopY + height;
      } else {
        newBottomY = Math.min(pos.y + height / 2, ctx.canvas.height);
        newTopY = newBottomY - height;
      }
      updateState(ctx, newTopY, newBottomY);
      thumb.y(newTopY);
      topHandle.y(newTopY - handleSize / 2);
      bottomHandle.y(newBottomY - handleSize / 2);
    }
  });

  topHandle.on('dragmove', () => {
    const newTopY = topHandle.y() + handleSize / 2;
    const bottomY = thumb.y() + thumb.height();
    const newHeight = bottomY - newTopY;
    thumb.y(newTopY);
    thumb.height(newHeight);
    updateState(ctx, newTopY, bottomY);
  });

  bottomHandle.on('dragmove', () => {
    const newBottomY = bottomHandle.y() + handleSize / 2;
    const newTopY = thumb.y();
    const newHeight = newBottomY - newTopY;
    thumb.height(newHeight);
    updateState(ctx, newTopY, newBottomY);
  });

  thumb.on('dragmove', () => {
    const newTopY = thumb.y();
    const newBottomY = newTopY + thumb.height();
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
  thumb.on('mouseenter', () => {
    document.body.style.cursor = 'move';
  });
  thumb.on('mouseleave', () => {
    document.body.style.cursor = 'default';
  });

  group.add(thumb);
  group.add(topHandle);
  group.add(bottomHandle);

  return {group, rect};
}
