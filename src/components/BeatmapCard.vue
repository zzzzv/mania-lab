<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { NCard, NIcon, NEllipsis } from 'naive-ui'
import { Star, Moon } from '@vicons/fa'
import { RankedStatuses } from 'osu-stable-db'
import type { Beatmap } from '@/models'
import { useSettingsStore } from '@/stores/settings'
import { ModsBadge, StatusBadge, ClientBadge } from './badges'
import { useBestScore } from '@/composables/useBestScore'

const props = defineProps<{ beatmap: Beatmap }>()
const bgUrl = ref<string | null>(null)
const ppyRating = ref<string>('-')
const xxyRating = ref<string | null>(null)
const nmSR = ref(0)

const bm = props.beatmap

onMounted(async () => {
  bgUrl.value = await bm.getBackgroundUrl()
  nmSR.value = bm.maniaSR?.PPY.NM ?? 0
  ppyRating.value = nmSR.value.toFixed(2)
  if (bm.maniaSR) {
    xxyRating.value = bm.maniaSR.XXY.NM.toFixed(2)
  }
})

const settings = useSettingsStore()

const displayTitle = computed(() => settings.useUnicode ? bm.titleUnicode : bm.title)
const displayArtist = computed(() => settings.useUnicode ? bm.artistUnicode : bm.artist)

const { bestScore } = useBestScore(
  () => props.beatmap.scores,
)

const bestScoreValue = computed(() => {
  if (!bestScore.value) return null
  if (settings.scorePriority === 'score') {
    return bestScore.value.totalScore.toLocaleString()
  }
  return (bestScore.value.accuracy * 100).toFixed(2) + '%'
})

const latestRank = computed(() => {
  const scores = props.beatmap.scores
  if (scores.length === 0) return null
  const latest = scores.reduce((a, b) => a.date > b.date ? a : b)
  const sorted = [...scores].sort((a, b) => {
    if (settings.scorePriority === 'score') return b.totalScore - a.totalScore
    return b.accuracy - a.accuracy
  })
  const rank = sorted.indexOf(latest) + 1
  const days = Math.floor((Date.now() - latest.date.getTime()) / 86400000)
  return { rank, total: scores.length, days }
})

const firstPlay = computed(() => {
  const scores = props.beatmap.scores
  if (scores.length === 0) return null
  const earliest = scores.reduce((a, b) => a.date < b.date ? a : b)
  return earliest.date
})

const bestPP = ref<{ pp: number; maxPP: number; mods: number } | null>(null)
const bestScoreApiMods = ref<import('@/models').APIModInfo[]>()
const bestPPApiMods = ref<import('@/models').APIModInfo[]>()

function updateBestPP() {
  const scores = props.beatmap.scores
  if (scores.length === 0) { bestPP.value = null; return }
  let best: typeof bestPP.value = null
  for (const s of scores) {
    const { pp, maxPP } = s.getPP(props.beatmap)
    if (pp === 0) continue
    const adjusted = { pp, maxPP, mods: s.mods }
    if (!best || adjusted.pp > best.pp) best = adjusted
  }
  bestPP.value = best
}

watch(() => props.beatmap.scores, updateBestPP, { immediate: true })

watch(bestScore, async (s) => {
  bestScoreApiMods.value = undefined
  if (s?.getAPIMods) bestScoreApiMods.value = await s.getAPIMods()
})

watch(bestPP, async () => {
  bestPPApiMods.value = undefined
  if (!bestPP.value) return
  const s = props.beatmap.scores.find(sc => sc.mods === bestPP.value!.mods)
  if (s?.getAPIMods) bestPPApiMods.value = await s.getAPIMods()
})

function fmtMs(ms: number) {
  const s = Math.floor(ms / 1000)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
function fmtDp1(n: number) {
  return n % 1 === 0 ? n.toString() : n.toFixed(1)
}
</script>

<template>
  <div class="card-wrapper">
    <NCard
      hoverable
      :bordered="false"
      style="width: 100%; height: 100%; --n-border-radius: 10px;"
      :content-style="{ padding: 0, overflow: 'hidden', height: '100%', borderRadius: '10px', position: 'relative' }"
    >
      <img v-if="bgUrl" class="card-bg" :src="bgUrl" alt="" />
      <div class="card-body">
      <div class="card-top">
        <StatusBadge :status="bm.rankedStatus" />
        <ClientBadge :client="bm.client" style="margin-left: auto" />
      </div>
      <div class="card-title"><NEllipsis>{{ displayTitle }}</NEllipsis></div>
      <div class="card-artist"><NEllipsis>{{ displayArtist }} — {{ bm.creator }}</NEllipsis></div>
      <div class="card-diff"><NEllipsis>{{ bm.difficulty }}</NEllipsis></div>
      <div class="card-rows">
        <div class="row">
          <span class="cell-left"><slot name="row-1-left">
            <span><span class="field-label">key</span> {{ bm.key }}</span>
            <span><span class="field-label">od</span> {{ fmtDp1(bm.OD) }}</span>
            <span><span class="field-label">hp</span> {{ fmtDp1(bm.HP) }}</span>
          </slot></span>
          <span class="cell-right">
            <template v-if="props.beatmap.scores.length === 0"><span class="no-scores">unplayed</span></template>
            <slot name="row-1-right" v-else>
              <template v-if="bestScoreValue">
                <span class="score-value"><span class="field-label">{{ settings.scorePriority === 'score' ? 'best score' : 'best acc' }}</span> {{ bestScoreValue }}</span>
                <ModsBadge v-if="bestScore" :mods="bestScore.mods" :api-mods="bestScoreApiMods" />
              </template>
            </slot>
          </span>
        </div>
        <div class="row">
          <span class="cell-left"><slot name="row-2-left">
            <span><span class="field-label">length</span> {{ fmtMs(bm.lengthMs) }}&emsp;<span class="field-label">bpm</span> {{ bm.bpm.toFixed(0) }}</span>
          </slot></span>
          <span class="cell-right">
            <slot v-if="props.beatmap.scores.length > 0" name="row-2-right">
              <template v-if="bestPP && bestPP.pp > 0">
                <span><span class="field-label">best pp</span> <span :class="bm.rankedStatus !== RankedStatuses.Ranked ? 'pp-unranked' : ''">{{ bestPP.pp.toFixed(0) }}/{{ bestPP.maxPP.toFixed(0) }}</span></span>
                <ModsBadge :mods="bestPP.mods" :api-mods="bestPPApiMods" />
              </template>
            </slot>
          </span>
        </div>
        <div class="row">
          <span class="cell-left"><slot name="row-3-left">
            <span>{{ ppyRating }}<NIcon size="12" style="margin-left:2px"><Star /></NIcon><template v-if="xxyRating"> {{ xxyRating }}<NIcon size="12" style="margin-left:2px"><Moon /></NIcon></template></span>
          </slot></span>
          <span class="cell-right">
            <slot v-if="props.beatmap.scores.length > 0" name="row-3-right">
              <template v-if="latestRank">
                <span><span class="field-label">latest</span> #{{ latestRank.rank }}/{{ latestRank.total }} {{ latestRank.days }}d</span>
              </template>
            </slot>
          </span>
        </div>
        <div class="row">
          <span class="cell-left"><slot name="row-4-left">
            <span><span class="field-label">note</span> {{ bm.noteCount }}</span>
            <span><span class="field-label">hold</span> {{ bm.holdCount }}</span>
            <span>{{ (bm.holdCount / (bm.noteCount + bm.holdCount) * 100).toFixed(1) }}%</span>
          </slot></span>
          <span class="cell-right">
            <slot v-if="props.beatmap.scores.length > 0" name="row-4-right">
              <template v-if="firstPlay"><span class="field-label">first play</span> {{ firstPlay.toLocaleDateString() }}</template>
            </slot>
          </span>
        </div>
      </div>
    </div>
  </NCard>
</div>
</template>

<style scoped>
.card-wrapper {
  width: 320px;
  height: 180px;
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.card-wrapper:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.2);
}

.card-bg {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}

.card-body {
  position: relative;
  height: 100%;
  padding: 8px 14px 14px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.55), rgba(0,0,0,0.75));
  color: #fff;
  display: flex; flex-direction: column; gap: 1px;
  white-space: nowrap;
}

.card-top { display: flex; gap: 6px; align-items: center; }



.card-title {
  font-weight: 700; font-size: 15px;
  text-shadow: 0 1px 3px rgba(0,0,0,0.5);
}
.card-artist {
  font-size: 12px; opacity: 0.9;
  text-shadow: 0 1px 2px rgba(0,0,0,0.4);
}
.card-diff { font-size: 12px; opacity: 0.85; margin-bottom: 4px; }

.card-rows { display: flex; flex-direction: column; gap: 2px; }
.row { display: flex; gap: 6px; font-size: 12px; align-items: center; height: 18px; flex-shrink: 0; }
.cell-left { display: flex; gap: 6px; align-items: center; }
.cell-right { margin-left: auto; display: flex; gap: 4px; justify-content: flex-end; align-items: center; }
.field-label { font-size: 10px; color: #ccc; }
.score-value { font-weight: 700; text-shadow: 0 1px 3px rgba(0,0,0,0.4); }
.pp-unranked { color: #999; }
.mods { display: flex; align-items: center; }
.unplayed {
  font-size: 12px;
}
.sym { color: #fff; }
</style>
