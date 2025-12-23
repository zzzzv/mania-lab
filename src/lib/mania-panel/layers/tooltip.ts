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
      const data = getData(shape);
      if (data) {
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

function getData(shape: any) {
  if (typeof shape.getAttr === 'function') {
    const attr = shape.getAttr('getData');
    if (typeof attr === 'function') return attr();
    if (attr !== undefined) return attr;
    return undefined;
  }
}

function formatTooltipText(data: any): string {
  const getLines = (obj: any): string[] => {
    return Object.entries(obj)
      .filter(([_, value]) => value !== undefined)
      .reduce<string[]>((lines, [key, value]) => {
        if (key === 'name' || key === 'title') {
          lines.unshift(`${value}`);
        } else if (Array.isArray(value)) {
          if (value.length <= 2) {
            lines.push(`${key}: [${value.join(', ')}]`);
          } else {
            lines.push(`${key}: [`);
            lines.push(...value.map(v => `  ${v},`));
            lines.push(`]`);
          }
        } else if (typeof value === 'object') {
          lines.push(`${key}: {`);
          lines.push(...getLines(value).map(line => `  ${line}`));
          lines.push(`}`);
        } else {
          lines.push(`${key}: ${value}`);
        }
        return lines;
      }, []);
  }
  return getLines(data).join('\n');
}

function createTooltip(_: Context) {
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