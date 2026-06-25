<script setup lang="ts">
import { ref, watch } from 'vue'
import { NSlider } from 'naive-ui'
import type { SRRange } from './types'

const props = defineProps<{
  modelValue: SRRange
  disabled?: boolean
}>()
const emit = defineEmits<{
  'update:modelValue': [v: SRRange]
}>()

const MAX = 10
const DELTA_MAX = 5

type LinkMode = 'ppy' | 'none' | 'xxy'
const local = ref(clone(props.modelValue))
const linkMode = ref<LinkMode>('none')
const deltaMin = ref(0)
const deltaMax = ref(0)

watch(() => props.modelValue, v => {
  local.value = clone(v)
}, { deep: true })

function clone(v: SRRange): SRRange {
  return { ppyMin: v.ppyMin, ppyMax: v.ppyMax, xxyMin: v.xxyMin, xxyMax: v.xxyMax }
}

const debounce = ref<ReturnType<typeof setTimeout>>()

function emitUpdate() {
  clearTimeout(debounce.value)
  debounce.value = setTimeout(() => emit('update:modelValue', { ...local.value }), 250)
}

function onPPY(v: number[]) {
  local.value.ppyMin = v[0]!
  local.value.ppyMax = v[1]! >= MAX ? null : v[1]!
  if (linkMode.value === 'ppy') applyPPYDelta()
  if (linkMode.value === 'xxy') applyXXYDelta()
  emitUpdate()
}

function onXXY(v: number[]) {
  local.value.xxyMin = v[0]!
  local.value.xxyMax = v[1]! >= MAX ? null : v[1]!
  if (linkMode.value === 'xxy') applyXXYDelta()
  if (linkMode.value === 'ppy') applyPPYDelta()
  emitUpdate()
}

function onDelta(v: number[]) {
  deltaMin.value = v[0]!
  deltaMax.value = v[1]!
  applyDelta()
  emitUpdate()
}

function applyDelta() {
  if (linkMode.value === 'ppy') applyPPYDelta()
  if (linkMode.value === 'xxy') applyXXYDelta()
}

function applyPPYDelta() {
  local.value.xxyMin = clamp(local.value.ppyMin + deltaMin.value, 0, MAX)
  local.value.xxyMax = local.value.ppyMax !== null
    ? clamp(local.value.ppyMax + deltaMax.value, 0, MAX)
    : null
}

function applyXXYDelta() {
  local.value.ppyMin = clamp(local.value.xxyMin + deltaMin.value, 0, MAX)
  local.value.ppyMax = local.value.xxyMax !== null
    ? clamp(local.value.xxyMax + deltaMax.value, 0, MAX)
    : null
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n))
}

function setLinkMode(m: LinkMode) {
  linkMode.value = m
  if (m === 'ppy') {
    deltaMin.value = +(local.value.xxyMin - local.value.ppyMin).toFixed(1)
    deltaMax.value = local.value.ppyMax !== null
      ? +(local.value.xxyMax! - local.value.ppyMax).toFixed(1)
      : 0
  } else if (m === 'xxy') {
    deltaMin.value = +(local.value.ppyMin - local.value.xxyMin).toFixed(1)
    deltaMax.value = local.value.xxyMax !== null
      ? +(local.value.ppyMax! - local.value.xxyMax).toFixed(1)
      : 0
  }
}
</script>

<template>
  <div class="sr-row" :class="{ disabled }">
    <div v-if="disabled" class="sr-unavailable">Star rating 数据包不可用, 需要后端先计算SR数据</div>
    <template v-else>
      <div class="sr-half">
        <div v-if="linkMode !== 'xxy'" class="slider-box">
          <NSlider :value="[local.ppyMin, local.ppyMax ?? MAX]" :min="0" :max="MAX" :step="0.1" range style="flex:1" @update:value="onPPY" />
          <span class="sr-val">{{ local.ppyMin.toFixed(1) }}–{{ local.ppyMax !== null ? local.ppyMax.toFixed(1) : '∞' }}</span>
        </div>
        <div v-else class="slider-box">
          <NSlider :value="[deltaMin, deltaMax]" :min="-DELTA_MAX" :max="DELTA_MAX" :step="0.1" range style="flex:1" @update:value="onDelta" />
          <span class="sr-val">Δ{{ deltaMin.toFixed(1) }}–{{ deltaMax.toFixed(1) }}</span>
        </div>
      </div>

      <div class="link-toggle">
        <button :class="['lt-btn', { active: linkMode === 'ppy' }]" @click="setLinkMode('ppy')">PPY</button>
        <button :class="['lt-btn', { active: linkMode === 'none' }]" @click="setLinkMode('none')">∥</button>
        <button :class="['lt-btn', { active: linkMode === 'xxy' }]" @click="setLinkMode('xxy')">XXY</button>
      </div>

      <div class="sr-half">
        <div v-if="linkMode !== 'ppy'" class="slider-box">
          <NSlider :value="[local.xxyMin, local.xxyMax ?? MAX]" :min="0" :max="MAX" :step="0.1" range style="flex:1" @update:value="onXXY" />
          <span class="sr-val">{{ local.xxyMin.toFixed(1) }}–{{ local.xxyMax !== null ? local.xxyMax.toFixed(1) : '∞' }}</span>
        </div>
        <div v-else class="slider-box">
          <NSlider :value="[deltaMin, deltaMax]" :min="-DELTA_MAX" :max="DELTA_MAX" :step="0.1" range style="flex:1" @update:value="onDelta" />
          <span class="sr-val">Δ{{ deltaMin.toFixed(1) }}–{{ deltaMax.toFixed(1) }}</span>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.sr-row { display:flex; align-items:center; gap:4px; flex:1; }
.sr-row.disabled { opacity:0.45; pointer-events:none; }
.sr-unavailable { font-size:12px; color:#999; padding:6px 0; user-select:none; }
.sr-half { display:flex; align-items:center; gap:4px; flex:1; min-width:0; }
.slider-box { display:flex; align-items:center; gap:2px; flex:1; min-width:0; }
.sr-val { font-size:11px; color:#999; min-width:35px; text-align:right; white-space:nowrap; }
.link-toggle { display:flex; border:1px solid #d9d9d9; border-radius:4px; overflow:hidden; flex-shrink:0; }
.lt-btn { border:none; background:#fff; font-size:11px; font-weight:500; padding:2px 8px; cursor:pointer; color:#888; border-right:1px solid #d9d9d9; }
.lt-btn:last-child { border-right:none; }
.lt-btn.active { background:#1a8cff; color:#fff; }
.lt-btn:hover:not(.active) { background:#f0f0f0; }
</style>
