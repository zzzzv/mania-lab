import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ScorePriority = 'accuracy' | 'score'

export const useSettingsStore = defineStore('settings', () => {
  const useUnicode = ref(true)
  const scorePriority = ref<ScorePriority>('accuracy')

  return { useUnicode, scorePriority }
}, {
  persist: { storage: localStorage },
})
