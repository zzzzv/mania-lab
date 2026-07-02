import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SearchState } from '@/components/search/types'

const defaultSearchState: SearchState = {
  client: null,
  lazerCache: false,
  stableCache: false,
  query: { keys: [7], rankedStatuses: [4], searchText: '', lastPlayed: { minIdx: 0, maxIdx: 30, unplayed: false } },
  filter: { srRange: { ppyMin: 0, ppyMax: null, xxyMin: 0, xxyMax: null, diffMin: -5, diffMax: 5, linkMode: 'none' }, sortField: null, scoreMode: 'overview' },
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
        if (data.state) { delete data.state.lazerCache; delete data.state.stableCache }
        return JSON.stringify(data)
      },
      deserialize(value) {
        const parsed = JSON.parse(value) as Record<string, any>
        if (parsed.state) { parsed.state.lazerCache = false; parsed.state.stableCache = false }
        return parsed
      },
    },
  },
})
