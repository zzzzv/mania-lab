import { ref } from 'vue'
import { defineStore } from 'pinia'

export type ScorePriority = 'accuracy' | 'score'

export type SRDisplayMode =
  | 'dual-nm'   // PPY.NM + XXY.NM
  | 'dual-ht'   // PPY.HT + XXY.HT
  | 'dual-dt'   // PPY.DT + XXY.DT
  | 'ppy-all'   // PPY.NM + HT + DT
  | 'xxy-all'   // XXY.NM + HT + DT

export const useSettingsStore = defineStore('settings', () => {
  const useUnicode = ref(true)
  const scorePriority = ref<ScorePriority>('accuracy')
  const srDisplayMode = ref<SRDisplayMode>('dual-nm')

  return { useUnicode, scorePriority, srDisplayMode }
}, {
  persist: { storage: localStorage },
})
