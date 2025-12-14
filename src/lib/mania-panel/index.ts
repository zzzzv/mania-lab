import Konva from 'konva';
import type { Beatmap, ReplayFrame } from '~/lib/mania-replay/src';
import { defaultOptions, resolveOptions } from './options';
import type { Options } from './options';
import { UI, PlayField, Tooltip } from './layers';

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
  const result = { ...target } as T;
  
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      const sourceValue = source[key];
      const targetValue = target[key];
      
      if (sourceValue !== undefined) {
        if (typeof sourceValue === 'object' && sourceValue !== null && !Array.isArray(sourceValue) &&
            typeof targetValue === 'object' && targetValue !== null && !Array.isArray(targetValue)) {
          result[key] = deepMerge(targetValue, sourceValue as DeepPartial<any>);
        } else {
          result[key] = sourceValue as T[Extract<keyof T, string>];
        }
      }
    }
  }
  
  return result;
}

export function createPanel(container: HTMLDivElement, optionsOverride?: DeepPartial<Options>) {
  const options = deepMerge(defaultOptions, optionsOverride || {});
  const stage = new Konva.Stage({
    container: container,
  });
  const uiLayer = new Konva.Layer();
  stage.add(uiLayer);
  const playfieldLayer = new Konva.Layer();
  stage.add(playfieldLayer);
  const tooltipLayer = new Konva.Layer();
  stage.add(tooltipLayer);

  const render = (beatmap: Beatmap, replay?: ReplayFrame[]) => {
    const ctx = resolveOptions(options, beatmap, replay);
    stage.width(ctx.stage.width);
    stage.height(ctx.stage.height);

    UI.render(ctx, uiLayer);
    ctx.state.onChange.subscribe(() => {
      PlayField.render(ctx, playfieldLayer);
    });
    PlayField.render(ctx, playfieldLayer);
    Tooltip.render(ctx, tooltipLayer);
  };

  return {
    render,
  };
}

