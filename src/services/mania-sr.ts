import { ref } from 'vue'
import { decode } from '@msgpack/msgpack'
import { api } from '@/api'
import type { ManiaSRData } from '@/api/types'
import { DataCache } from '@/services/utils'

/** Whether the SR pack was loaded successfully. */
export const srAvailable = ref(true)

export const srCache = new DataCache(async () => {
  try {
    const buf = await api.fetchManiaSRPack()
    const raw = decode(new Uint8Array(buf)) as Record<string, unknown>
    srAvailable.value = true
    return new Map(
      Object.entries(raw).map(([key, val]) => [key, val as ManiaSRData]),
    )
  } catch {
    srAvailable.value = false
    // Return empty map so .value still works downstream
    return new Map()
  }
})

export function getSRData(md5Hash: string): ManiaSRData | undefined {
  return srCache.value.get(md5Hash)
}
