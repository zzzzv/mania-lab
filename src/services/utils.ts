/**
 * Explicitly-initialised async cache.  Call `init()` once, then access the
 * cached value synchronously via `.value`.  Throws if accessed before init.
 */
export class DataCache<T> {
  private _data: T | null = null
  private _pending: Promise<void> | null = null

  constructor(private readonly factory: () => Promise<T>) {}

  async init(): Promise<void> {
    if (this._data) return
    if (this._pending) return this._pending
    this._pending = (async () => {
      try {
        this._data = await this.factory()
      } finally {
        this._pending = null
      }
    })()
    return this._pending
  }

  get initialized(): boolean {
    return this._data !== null
  }

  /** Access the cached data. Throws if not initialised. */
  get value(): T {
    if (this._data === null) throw new Error('DataCache not initialised – call init() first')
    return this._data
  }

  /** Drop cached data so the next `init()` re-fetches. */
  reset(): void {
    this._data = null
    this._pending = null
  }
}
