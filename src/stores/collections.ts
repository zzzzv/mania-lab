import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { SearchState } from '@/components/search/types'

export interface DynamicCollection {
  id: string
  name: string
  state: SearchState
}

export const useCollectionsStore = defineStore('collections', () => {
  const collections = ref<DynamicCollection[]>([])

  function add(name: string, state: SearchState) {
    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
    collections.value.push({ id, name, state: JSON.parse(JSON.stringify(state)) })
  }

  function remove(id: string) {
    const idx = collections.value.findIndex(c => c.id === id)
    if (idx !== -1) collections.value.splice(idx, 1)
  }

  function rename(id: string, name: string) {
    const c = collections.value.find(c => c.id === id)
    if (c) c.name = name
  }

  function updateState(id: string, state: SearchState) {
    const c = collections.value.find(c => c.id === id)
    if (c) c.state = JSON.parse(JSON.stringify(state))
  }

  return { collections, add, remove, rename, updateState }
}, {
  persist: { storage: localStorage },
})
