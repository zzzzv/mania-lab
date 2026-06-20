export function timed<T>(label: string, thresholdMs: number, fn: () => T): T
export function timed<T>(label: string, thresholdMs: number, fn: () => Promise<T>): Promise<T>
export function timed<T>(label: string, thresholdMs: number, fn: (() => T) | (() => Promise<T>)): T | Promise<T> {
  const t0 = performance.now()
  const result = fn()
  if (result instanceof Promise) {
    return result.then(v => {
      const elapsed = performance.now() - t0
      if (elapsed >= thresholdMs) console.log(`[${label}] ${elapsed.toFixed(0)}ms`)
      return v
    })
  }
  const elapsed = performance.now() - t0
  if (elapsed >= thresholdMs) console.log(`[${label}] ${elapsed.toFixed(0)}ms`)
  return result
}
