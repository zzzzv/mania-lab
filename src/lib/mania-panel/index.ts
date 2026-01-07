import Konva from 'konva';
import { createDefaultOptions, resolveOptions } from './options';
import type { Options } from './options';
import { UI, PlayField, Tooltip } from './layers';
import { deepMerge, type DeepPartial } from './utils';

export * from './options';
export * from './utils';

export function createPanel(container: HTMLDivElement) {
  const stage = new Konva.Stage({
    container: container,
  });
  const uiLayer = new Konva.Layer();
  stage.add(uiLayer);
  const playfieldLayer = new Konva.Layer();
  stage.add(playfieldLayer);
  const tooltipLayer = new Konva.Layer();
  stage.add(tooltipLayer);

  let options = createDefaultOptions();
  let ctx = resolveOptions(options);

  const setOptions = (newOptions: DeepPartial<Options>) => {
    options = deepMerge(options, newOptions);
    ctx = resolveOptions(options);
  }

  const render = () => {
    stage.width(ctx.canvas.width);
    stage.height(ctx.canvas.height);

    UI.render(ctx, uiLayer);
    ctx.state.onChange.subscribe(() => {
      PlayField.render(ctx, playfieldLayer);
    });
    PlayField.render(ctx, playfieldLayer);
    Tooltip.render(ctx, tooltipLayer);
  };

  const destroy = () => {
    stage.destroy();
  }

  return {
    setOptions,
    render,
    destroy,
    getContext: () => ctx,
  };
}

