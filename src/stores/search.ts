import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SearchState } from '@/components/search/types'

const defaultSearchState: SearchState = {
  client: null,
  lazerCache: false,
  query: { keys: [], rankedStatuses: [], searchText: '', lastPlayed: { minIdx: 0, maxIdx: 0, unplayed: true } },
  filter: { srRange: { ppyMin: 0, ppyMax: null, xxyMin: 0, xxyMax: null }, sortField: null, scoreMode: 'overview' },
}

export const useSearchStore = defineStore('search', () => {
  const state = ref<SearchState>({ ...defaultSearchState })

  return { state }
}, {
  persist: {
    storage: localStorage,
    serializer: {
      serialize(value) {
        const data = JSON.parse(JSON.stringify(value)) as Record<string, any>
        if (data.state) delete data.state.lazerCache
        return JSON.stringify(data)
      },
      deserialize(value) {
        const parsed = JSON.parse(value) as Record<string, any>
        if (parsed.state) parsed.state.lazerCache = false
        return parsed
      },
    },
  },
})
