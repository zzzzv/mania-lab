import Konva from 'konva';
import type { Context } from '../options';

export function render(ctx: Context, layer: Konva.Layer) {
  layer.destroyChildren();

  if (ctx.tooltip.enabled) {
    ctx.tooltip.format ??= formatTooltipText;
    const tooltip = createTooltip(ctx);
    layer.add(tooltip);
    layer.batchDraw();

    ctx.state.onChange.subscribe(() => {
      tooltip.hide();
    });

    layer.getStage()?.off('click');
    layer.getStage()?.on('click', (e) => {
      const shape = e.target;
      if (shape instanceof Konva.Rect && shape.getAttr('getData')) {
        const data = shape.getAttr('getData')();
        const text = ctx.tooltip.format!(data);
        tooltip.getText().text(text);

        const pos = layer.getRelativePointerPosition();
        if (pos) {
          tooltip.position({
            x: pos.x,
            y: pos.y,
          });
        }
        tooltip.show();
      } else {
        tooltip.hide();
      }
      layer.batchDraw();
    });
  }
}

function formatTooltipText(data: any) {
  const lines: string[] = [];
  for (const key in data) {
    if (data.hasOwnProperty(key) && data[key] !== undefined) {
      lines.push(`${key}: ${data[key]}`);
    }
  }
  return lines.join('\n');
}

function createTooltip(ctx: Context) {
  const label = new Konva.Label({
    opacity: 0.75,
    visible: false,
  });

  label.add(
    new Konva.Tag({
      fill: '#ffffff',
      pointerDirection: 'down',
      pointerWidth: 10,
      pointerHeight: 10,
      lineJoin: 'round',
      shadowColor: 'black',
      shadowBlur: 10,
      shadowOffsetX: 3,
      shadowOffsetY: 3,
      shadowOpacity: 0.3,
    })
  );

  label.add(
    new Konva.Text({
      text: '',
      fontSize: 14,
      padding: 5,
      fill: '#000000',
    })
  );

  return label;
}