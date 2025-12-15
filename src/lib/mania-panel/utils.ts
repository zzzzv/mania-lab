export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export function deepMerge<T extends object>(target: T, source: DeepPartial<T>): T {
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

export function createEvent() {
  const listeners: Array<() => void> = [];
  return {
    emit: () => listeners.forEach(fn => fn()),
    subscribe: (fn: () => void) => {
      listeners.push(fn);
      return () => {
        const idx = listeners.indexOf(fn);
        if (idx >= 0) listeners.splice(idx, 1);
      };
    },
  };
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}