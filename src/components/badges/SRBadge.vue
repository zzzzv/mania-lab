<script setup lang="ts">
import { computed } from 'vue'
import { NIcon } from 'naive-ui'
import { Star, Moon } from '@vicons/fa'
import type { ManiaSRData } from '@/api/types'
import { useSettingsStore } from '@/stores/settings'
import type { SRDisplayMode } from '@/stores/settings'

const props = defineProps<{ maniaSr: ManiaSRData | null }>()

const settings = useSettingsStore()

interface Entry {
  kind: 'mode-label' | 'item-label' | 'value' | 'icon'
  text?: string
  iconComp?: any
}

const srLabel = computed(() => {
  const m = props.maniaSr
  if (!m) return []

  const mode = settings.srDisplayMode
  const entries: Entry[] = []

  switch (mode) {
    case 'dual-nm': {
      entries.push({ kind: 'value', text: m.PPY.NM.toFixed(2) })
      entries.push({ kind: 'icon', iconComp: Star })
      if (m.XXY) {
        entries.push({ kind: 'value', text: m.XXY.NM.toFixed(2) })
        entries.push({ kind: 'icon', iconComp: Moon })
      }
      break
    }
    case 'dual-ht': {
      entries.push({ kind: 'mode-label', text: 'HT' })
      entries.push({ kind: 'value', text: m.PPY.HT.toFixed(2) })
      entries.push({ kind: 'icon', iconComp: Star })
      if (m.XXY) {
        entries.push({ kind: 'value', text: m.XXY.HT.toFixed(2) })
        entries.push({ kind: 'icon', iconComp: Moon })
      }
      break
    }
    case 'dual-dt': {
      entries.push({ kind: 'mode-label', text: 'DT' })
      entries.push({ kind: 'value', text: m.PPY.DT.toFixed(2) })
      entries.push({ kind: 'icon', iconComp: Star })
      if (m.XXY) {
        entries.push({ kind: 'value', text: m.XXY.DT.toFixed(2) })
        entries.push({ kind: 'icon', iconComp: Moon })
      }
      break
    }
    case 'ppy-all': {
      entries.push({ kind: 'item-label', text: 'NM' })
      entries.push({ kind: 'value', text: m.PPY.NM.toFixed(2) })
      entries.push({ kind: 'item-label', text: 'HT' })
      entries.push({ kind: 'value', text: m.PPY.HT.toFixed(2) })
      entries.push({ kind: 'item-label', text: 'DT' })
      entries.push({ kind: 'value', text: m.PPY.DT.toFixed(2) })
      entries.push({ kind: 'icon', iconComp: Star })
      break
    }
    case 'xxy-all': {
      entries.push({ kind: 'item-label', text: 'NM' })
      entries.push({ kind: 'value', text: m.XXY.NM.toFixed(2) })
      entries.push({ kind: 'item-label', text: 'HT' })
      entries.push({ kind: 'value', text: m.XXY.HT.toFixed(2) })
      entries.push({ kind: 'item-label', text: 'DT' })
      entries.push({ kind: 'value', text: m.XXY.DT.toFixed(2) })
      entries.push({ kind: 'icon', iconComp: Moon })
      break
    }
  }
  return entries
})
</script>

<template>
  <span class="sr-badge">
    <template v-for="(e, i) in srLabel" :key="i">
      <span v-if="e.kind === 'mode-label'" class="mode-label">{{ e.text }}</span>
      <span v-else-if="e.kind === 'item-label'" class="item-label">{{ e.text }}</span>
      <span v-else-if="e.kind === 'value'" class="sr-value">{{ e.text }}</span>
      <NIcon v-else-if="e.kind === 'icon'" size="12"><component :is="e.iconComp" /></NIcon>
    </template>
  </span>
</template>

<style scoped>
.sr-badge {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.mode-label {
  font-size: 12px;
  font-weight: 600;
  margin-right: 2px;
}
.item-label {
  font-size: 8px;
  color: #ccc;
  margin-left: 4px;
  line-height: 1;
  vertical-align: 0.15em;
}
.item-label:first-child {
  margin-left: 0;
}
</style>
