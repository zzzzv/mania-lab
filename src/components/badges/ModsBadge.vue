<script setup lang="ts">
import { computed } from 'vue'
import type { APIModInfo } from '@/models'

// Mod type categories — mirrors osu-classes' ModType enum values.
const ModType = {
  DifficultyReduction: 0,
  DifficultyIncrease: 1,
  Conversion: 2,
  Automation: 3,
  Fun: 4,
  System: 5,
} as const

const props = defineProps<{ mods?: number; apiMods?: APIModInfo[] }>()

interface ModItem { acronym: string; label: string; color: string }

// Mod category mapping — covers both stable and lazer mods
const MOD_TYPE: Record<string, number> = {
  // Difficulty Reduction (green)
  NF: ModType.DifficultyReduction,
  EZ: ModType.DifficultyReduction,
  HT: ModType.DifficultyReduction,
  // Difficulty Increase (red)
  HR: ModType.DifficultyIncrease,
  DT: ModType.DifficultyIncrease,
  NC: ModType.DifficultyIncrease,
  FL: ModType.DifficultyIncrease,
  HD: ModType.DifficultyIncrease,
  FI: ModType.DifficultyIncrease,
  SD: ModType.DifficultyIncrease,
  PF: ModType.DifficultyIncrease,
  DA: ModType.DifficultyIncrease,  // Difficulty Adjust (lazer)
  CL: ModType.DifficultyIncrease,  // Classic (lazer) — affects scoring
  // Conversion (purple)
  '1K': ModType.Conversion,
  '2K': ModType.Conversion,
  '3K': ModType.Conversion,
  '4K': ModType.Conversion,
  '5K': ModType.Conversion,
  '6K': ModType.Conversion,
  '7K': ModType.Conversion,
  '8K': ModType.Conversion,
  '9K': ModType.Conversion,
  RD: ModType.Conversion,  // Random
  DS: ModType.Conversion,  // Dual Stages
  MR: ModType.Conversion,  // Mirror
  CO: ModType.Conversion,  // Co-op (lazer)
  // Automation (light blue)
  AT: ModType.Automation,
  CM: ModType.Automation,
  // Fun (pink)
  AP: ModType.Fun,   // Adaptive Pitch (lazer)
  // System (gray)
  V2: ModType.System,
  // Unknown → gray default in the color function
}

/** Map ModType to a tag color. */
function typeColor(t: number): string {
  switch (t) {
    case ModType.DifficultyReduction: return '#4caf50'  // green — easier
    case ModType.DifficultyIncrease: return '#e53935'   // red — harder
    case ModType.Conversion:         return '#7c4dff'   // purple
    case ModType.Automation:         return '#42a5f5'   // light blue
    case ModType.Fun:                return '#e91e63'   // pink
    case ModType.System:             return '#78909c'   // gray
    default:                         return '#78909c'
  }
}

const items = computed<ModItem[]>(() => {
  const list = props.apiMods
  if (!list || list.length === 0) return []
  return list.map(m => {
    const cat = MOD_TYPE[m.Acronym]
    const color = cat != null ? typeColor(cat) : '#78909c'

    let suffix = ''
    const rawVal = m.Settings && typeof m.Settings === 'object'
      ? (m.Settings as Record<string, unknown>).value as number | undefined
      : undefined
    if (rawVal != null) {
      // Show suffix unless the value matches a known default
      const isDefault = (m.Acronym === 'HT' && rawVal === 0.75) || rawVal === 1.5
      if (!isDefault) {
        const frac = String(rawVal).split('.')[1]
        if (frac) suffix = '.' + frac
      }
    }
    return { acronym: m.Acronym, label: `${m.Acronym}${suffix}`, color }
  })
})
</script>

<template>
  <span class="mods" v-if="items.length > 0">
    <span class="mod-capsule">
      <span v-for="(it, i) in items" :key="it.acronym" class="mod-seg" :style="{ background: it.color }">
        <span v-if="i > 0 && items[i-1]!.color === it.color" class="mod-sep">|</span>
        <span class="mod-text">{{ it.label }}</span>
      </span>
    </span>
  </span>
</template>

<style scoped>
.mods { display: flex; align-items: center; }
.mod-capsule { display: flex; border-radius: 8px; overflow: hidden; line-height: 1; }
.mod-seg { display: flex; align-items: center; }
.mod-sep { color: rgba(255,255,255,0.35); font-size: 10px; }
.mod-text { color: #fff; font-size: 10px; font-weight: 600; padding: 1px 1.5px; }
</style>
