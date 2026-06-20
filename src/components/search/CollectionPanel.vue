<script setup lang="ts">
import { ref, computed } from 'vue'
import { NSelect, NButton, NInput, NSwitch } from 'naive-ui'
import { useCollectionsStore, type DynamicCollection } from '@/stores/collections'
import type { SearchState } from './types'

const props = defineProps<{
  modelValue: SearchState
  beatmapCount: number
  client: 'stable' | 'lazer' | null
}>()

const emit = defineEmits<{
  'select': [state: SearchState]
  'export': [name: string, overwrite: boolean]
}>()

const store = useCollectionsStore()
const exportName = ref('')
const overwrite = ref(false)

const selectedId = ref<string | null>(null)

const collectionOptions = computed(() =>
  store.collections.map(c => ({ label: c.name, value: c.id })),
)

function stripClient(s: SearchState): SearchState {
  const { client: _, lazerCache: __, ...rest } = s
  return rest as SearchState
}

function mergeState(saved: SearchState): SearchState {
  return {
    ...saved,
    client: props.modelValue.client,
    lazerCache: props.modelValue.lazerCache,
  }
}

function onSelect(id: string | null) {
  selectedId.value = id
  if (!id) return
  const c = store.collections.find(x => x.id === id)
  if (c) {
    exportName.value = c.name
    emit('select', mergeState(c.state))
  }
}

function savePreset() {
  const name = exportName.value.trim()
  if (!name) return
  const clean = stripClient(props.modelValue)
  const existing = store.collections.find(c => c.name === name)
  if (existing) {
    store.updateState(existing.id, clean)
    selectedId.value = existing.id
  } else {
    store.add(name, clean)
  }
}

function deletePreset() {
  if (!selectedId.value) return
  store.remove(selectedId.value)
  selectedId.value = null
}

function handleExport() {
  const name = exportName.value.trim()
  if (!name) return
  emit('export', name, overwrite.value)
}
</script>

<template>
  <div class="cp-row">
    <NSelect
      :value="selectedId" :options="collectionOptions" clearable placeholder="Preset…"
      size="small" style="width:200px;flex-shrink:0"
      @update:value="onSelect"
    />
    <NButton v-if="selectedId" size="tiny" quaternary type="error" @click="deletePreset" style="flex-shrink:0">✕</NButton>
    <NInput v-model:value="exportName" placeholder="Collection name…" size="small" style="flex:1; min-width:200px; max-width:500px" />
    <NButton size="tiny" :disabled="!exportName.trim()" @click="savePreset">保存为预设</NButton>
    <span class="cp-toggle-label">覆盖</span>
    <NSwitch :value="overwrite" size="small" @update:value="v => (overwrite = v)" />
    <NButton size="tiny" type="primary" :disabled="!exportName.trim() || beatmapCount === 0" @click="handleExport">
      导出到客户端 ({{ beatmapCount }})
    </NButton>
  </div>
</template>

<style scoped>
.cp-row { display: flex; align-items: center; gap: 6px; }
.cp-toggle-label { font-size: 11px; color: #888; white-space: nowrap; flex-shrink: 0; }
</style>
