<script setup lang="ts">
import { RankedStatuses } from 'osu-stable-db'
import { ModsBadge, GradeBadge } from './badges'
import type { Beatmap } from '@/models'
import BeatmapCard from './BeatmapCard.vue'
import { computed, ref, watch } from 'vue'

const props = defineProps<{ beatmap: Beatmap; selectedScoreIndex: number }>()
const sc = computed(() => props.beatmap.scores[props.selectedScoreIndex] ?? null)

const scorePP = ref<{ pp: number; maxPP: number; ppAcc: number } | null>(null)
const apiMods = ref<import('@/models').APIModInfo[]>()

watch(sc, async (s) => {
  if (!s) { scorePP.value = null; apiMods.value = undefined; return }
  scorePP.value = s.getPP(props.beatmap)
  if (s.getAPIMods) {
    apiMods.value = await s.getAPIMods()
  } else {
    apiMods.value = undefined
  }
}, { immediate: true })
</script>

<template>
  <BeatmapCard v-if="sc" :beatmap="props.beatmap">
    <template #row-1-right>
      <span class="score-value"><span class="field-label">score</span> {{ sc.totalScore.toLocaleString() }}</span>
      <span v-if="sc.perfectCombo" class="fc">FC</span>
      <span>{{ sc.maxCombo }}x</span>
    </template>
    <template #row-2-right>
      <GradeBadge :grade="sc.grade" />
      <span><span class="field-label">acc</span> {{ (sc.accuracy * 100).toFixed(2) }}%</span>
      <ModsBadge :mods="sc.mods" :api-mods="apiMods" />
    </template>
    <template #row-3-right>
      <template v-if="scorePP && scorePP.pp > 0">
        <span><span class="field-label">pp</span> <span :class="props.beatmap.rankedStatus !== RankedStatuses.Ranked ? 'pp-unranked' : ''">{{ scorePP.pp.toFixed(0) }}/{{ scorePP.maxPP.toFixed(0) }}</span> {{ (scorePP.ppAcc * 100).toFixed(2) }}%</span>
      </template>
    </template>
    <template #row-4-left>
      <span class="result">
        <span class="result-perfect">{{ sc.hitResults[0] }}</span><span class="sep">/</span>
        <span class="result-great">{{ sc.hitResults[1] }}</span><span class="sep">/</span>
        <span class="result-good">{{ sc.hitResults[2] }}</span><span class="sep">/</span>
        <span class="result-ok">{{ sc.hitResults[3] }}</span><span class="sep">/</span>
        <span class="result-meh">{{ sc.hitResults[4] }}</span><span class="sep">/</span>
        <span class="result-miss">{{ sc.hitResults[5] }}</span>
      </span>
    </template>
    <template #row-4-right><span>{{ sc.playerName }}</span><span>{{ sc.date.toLocaleDateString() }} {{ sc.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }}</span></template>
  </BeatmapCard>
</template>

<style scoped>
.score-value { font-size: 18px; font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
.fc { color: #f1c40f; font-weight: 600; }
.pp-unranked { color: #999; }
.mods { display: flex; align-items: center; }
.field-label { font-size: 10px; color: #ccc; }
.result { display: flex; gap: 1px; font-size: 13px; }
.sep { opacity: 0.25; }
.result-perfect {
  background: linear-gradient(90deg, #ff6b6b, #ffd93d, #6bcbff, #ff6bb5);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 2px rgba(255,255,255,0.3);
}
.result-great { color: #ffd93d; }
.result-good { color: #6bff6b; }
.result-ok { color: #6bcbff; }
.result-meh { color: #999; }
.result-miss { color: #ff6b6b; }
</style>
