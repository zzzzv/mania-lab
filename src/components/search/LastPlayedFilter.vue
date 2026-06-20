<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSlider, NButton } from 'naive-ui'
import { lastPlayedTicks } from './types'
import type { LastPlayedFilter } from './types'

const props = defineProps<{ modelValue: LastPlayedFilter }>()
const emit = defineEmits<{ 'update:modelValue': [v: LastPlayedFilter] }>()

const TICKS = lastPlayedTicks()
const MAX_IDX = TICKS.length - 1

function label(idx: number): string {
  const v = TICKS[idx]!
  if (!isFinite(v)) return '∞'
  if (v === 0) return '0'
  return `${Math.round(v)}d`
}

// Tick boundary indices where step changes
const BOUNDARIES = [
  { idx: 30, label: '30' },
  { idx: 42, label: '90' },
  { idx: 51, label: '360' },
  { idx: 55, label: '1800' },
] as const

const marks: Record<number, string> = {}
for (const b of BOUNDARIES) {
  marks[b.idx] = b.label
}

function formatTooltip(idx: number): string {
  return label(idx)
}

const localMin = ref(props.modelValue.minIdx)
const localMax = ref(props.modelValue.maxIdx)

const displayMin = computed(() => label(localMin.value))
const displayMax = computed(() => label(localMax.value))

function onSlide(v: number[]) {
  localMin.value = Math.min(v[0]!, v[1]!)
  localMax.value = Math.max(v[0]!, v[1]!)
  clearTimeout(debounce.value)
  debounce.value = setTimeout(() => emitValue({}), 500)
}

const debounce = ref<ReturnType<typeof setTimeout>>()

function emitValue(extra: Partial<LastPlayedFilter>) {
  emit('update:modelValue', {
    minIdx: localMin.value,
    maxIdx: localMax.value,
    unplayed: props.modelValue.unplayed,
    ...extra,
  })
}

function toggleUnplayed() {
  emitValue({ unplayed: !props.modelValue.unplayed })
}
</script>

<template>
  <div class="lp-filter">
    <div class="lp-body">
      <div class="lp-label">Last Played</div>
      <div class="lp-slider-col">
        <NSlider
          :value="[localMin, localMax]"
          :min="0"
          :max="MAX_IDX"
          :step="1"
          :marks="marks"
          :format-tooltip="formatTooltip"
          range
          style="width:100%"
          @update:value="onSlide"
        />
      </div>
      <span class="lp-range">{{ displayMin }}–{{ displayMax }}</span>
      <NButton
        :type="modelValue.unplayed ? 'primary' : 'default'"
        size="tiny"
        @click="toggleUnplayed"
      >Unplayed</NButton>
    </div>
  </div>
</template>

<style scoped>
.lp-filter { border: 1px solid #e0e0e0; border-radius: 6px; padding: 4px 8px; flex: 1; max-width: 800px; }
.lp-label { font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; white-space: nowrap; flex-shrink: 0; }
.lp-body { display: flex; align-items: center; gap: 8px; }
.lp-slider-col { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.lp-range { font-size: 11px; color: #999; min-width: 50px; text-align: right; white-space: nowrap; flex-shrink: 0; }
/* tighten slider-to-mark gap */
.lp-slider-col :deep(.n-slider-mark) { margin-top: 0; line-height: 1.2; }
.lp-slider-col :deep(.n-slider) { padding-bottom: 2px; }
</style>