import { computed } from 'vue'
import { useSettingsStore } from '@/stores/settings'
import type { Score } from '@/models'

export function useBestScore(scores: () => readonly Score[]) {
  const settings = useSettingsStore()

  const bestScore = computed<Score | null>(() => {
    const sc = scores()
    if (sc.length === 0) return null
    if (settings.scorePriority === 'score') {
      return sc.reduce((best, s) => s.totalScore > best.totalScore ? s : best)
    }
    return sc.reduce((best, s) => s.accuracy > best.accuracy ? s : best)
  })

  return { bestScore }
}
