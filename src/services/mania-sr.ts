import { decode } from '@msgpack/msgpack'
import { api } from '@/api'
import type { ManiaSRData } from '@/api/types'
import { DataCache } from '@/services/utils'

export const srCache = new DataCache(async () => {
  const buf = await api.fetchManiaSRPack()
  const raw = decode(new Uint8Array(buf)) as Record<string, unknown>
  return new Map(
    Object.entries(raw).map(([key, val]) => [key, val as ManiaSRData]),
  )
})

export function getSRData(md5Hash: string): ManiaSRData | undefined {
  return srCache.value.get(md5Hash)
}
