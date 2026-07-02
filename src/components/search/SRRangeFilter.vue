<script setup lang="ts">
import { ref, watch } from 'vue'
import { NSlider } from 'naive-ui'
import type { SRRange } from './types'
import { clamp } from '@/utils'

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
const linkMode = ref<LinkMode>(props.modelValue.linkMode ?? 'none')
const deltaMin = ref(0)
const deltaMax = ref(0)

watch(() => props.modelValue, v => {
  local.value = clone(v)
  linkMode.value = v.linkMode ?? 'none'
  deltaMin.value = v.diffMin
  deltaMax.value = v.diffMax
}, { deep: true })

function clone(v: SRRange): SRRange {
  return {
    ppyMin: v.ppyMin, ppyMax: v.ppyMax,
    xxyMin: v.xxyMin, xxyMax: v.xxyMax,
    diffMin: v.diffMin, diffMax: v.diffMax,
    linkMode: v.linkMode,
  }
}

const debounce = ref<ReturnType<typeof setTimeout>>()

function emitUpdate() {
  clearTimeout(debounce.value)
  debounce.value = setTimeout(() => emit('update:modelValue', { ...local.value }), 250)
}

function onPPY(v: number[]) {
  const [min, max] = v[0]! <= v[1]! ? [v[0]!, v[1]!] : [v[1]!, v[0]!]
  local.value.ppyMin = min
  local.value.ppyMax = max >= MAX ? null : max
  emitUpdate()
}

function onXXY(v: number[]) {
  const [min, max] = v[0]! <= v[1]! ? [v[0]!, v[1]!] : [v[1]!, v[0]!]
  local.value.xxyMin = min
  local.value.xxyMax = max >= MAX ? null : max
  emitUpdate()
}

function onDelta(v: number[]) {
  const [min, max] = v[0]! <= v[1]! ? [v[0]!, v[1]!] : [v[1]!, v[0]!]
  deltaMin.value = min
  deltaMax.value = max
  local.value.diffMin = min
  local.value.diffMax = max
  emitUpdate()
}

function setLinkMode(m: LinkMode) {
  const prev = linkMode.value
  linkMode.value = m
  local.value.linkMode = m
  if (m === 'ppy') {
    // 先算 diff (xxy - ppy) 再清零 xxy — 大值与小值交叉相减
    const dMin = +(local.value.xxyMin - (local.value.ppyMax ?? local.value.xxyMax ?? MAX)).toFixed(1)
    const dMax = +((local.value.xxyMax ?? local.value.ppyMax ?? MAX) - local.value.ppyMin).toFixed(1)
    local.value.xxyMin = 0
    local.value.xxyMax = null
    deltaMin.value = dMin
    deltaMax.value = dMax
    local.value.diffMin = dMin
    local.value.diffMax = dMax
  } else if (m === 'xxy') {
    // 先算 diff (ppy - xxy) 再清零 ppy — 大值与小值交叉相减
    const dMin = +(local.value.ppyMin - (local.value.xxyMax ?? local.value.ppyMax ?? MAX)).toFixed(1)
    const dMax = +((local.value.ppyMax ?? local.value.xxyMax ?? MAX) - local.value.xxyMin).toFixed(1)
    local.value.ppyMin = 0
    local.value.ppyMax = null
    deltaMin.value = dMin
    deltaMax.value = dMax
    local.value.diffMin = dMin
    local.value.diffMax = dMax
  } else {
    // ∥ 模式：用一侧 + diff 还原另一侧初值，diff 设成全范围
    if (prev === 'ppy') {
      local.value.xxyMin = clamp(local.value.ppyMin + local.value.diffMin, 0, MAX)
      local.value.xxyMax = local.value.ppyMax !== null
        ? clamp(local.value.ppyMax + local.value.diffMax, 0, MAX)
        : null
    } else if (prev === 'xxy') {
      local.value.ppyMin = clamp(local.value.xxyMin + local.value.diffMin, 0, MAX)
      local.value.ppyMax = local.value.xxyMax !== null
        ? clamp(local.value.xxyMax + local.value.diffMax, 0, MAX)
        : null
    }
    local.value.diffMin = -DELTA_MAX
    local.value.diffMax = DELTA_MAX
  }
  emitUpdate()
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
