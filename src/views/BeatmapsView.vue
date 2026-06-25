<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { NAlert, NH2, useMessage } from 'naive-ui'
import { api } from '@/api'
import { getBeatmaps } from '@/services/stable'
import { queryLazerBeatmaps } from '@/services/lazer'
import { srCache, srAvailable } from '@/services/mania-sr'
import CardGrid from '@/components/CardGrid.vue'
import SearchPanel from '@/components/SearchPanel.vue'
import { runSearch } from '@/components/search/pipeline'
import { useSearchStore } from '@/stores/search'
import type { Beatmap } from '@/models'
import type { ApiStatus } from '@/api/types'

const beatmaps = ref<Beatmap[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

const search = useSearchStore()
const message = useMessage()

const stableAvailable = ref(true)
const lazerAvailable = ref(true)

// Notify when SR pack is unavailable (404 etc.)
watch(srAvailable, (ok) => {
  if (!ok) message.warning('Star rating 数据包不可用, 需要后端先计算SR数据')
})

// ── Committed search state ──
const committedFilter = ref({ ...search.state })

const filtered = computed(() => runSearch(beatmaps.value, committedFilter.value))

// Re-run pipeline when filter or query state changes
watch(() => search.state, () => {
  committedFilter.value = { ...search.state }
}, { deep: true })

// Switch client → clear old data; auto-fetch only for stable or lazer+cache
watch(() => search.state.client, () => {
  beatmaps.value = []
  const s = search.state
  if (s.client !== 'lazer' || s.lazerCache) commitFilter()
})

async function commitFilter() {
  committedFilter.value = { ...search.state }
  const s = search.state
  const q = s.query
  const isLazer = s.client === 'lazer'
  loading.value = true
  error.value = null
  try {
    if (!isLazer) {
      if (!stableAvailable.value) { error.value = 'Stable 后端不可用'; loading.value = false; return }
      beatmaps.value = await getBeatmaps()
    } else {
      if (!lazerAvailable.value) { error.value = 'Lazer 后端不可用'; loading.value = false; return }
      beatmaps.value = await queryLazerBeatmaps(q, s.lazerCache)
    }
  } catch (e) {
    error.value = String(e)
  } finally {
    loading.value = false
  }
}

onMounted(async () => {
  // Check SR data availability early, before beatmap loading
  srCache.init()
  try {
    const s: ApiStatus = await api.getStatus()
    stableAvailable.value = s.stable?.isAvailable ?? false
    lazerAvailable.value = s.lazer?.isAvailable ?? false
    if (!stableAvailable.value && lazerAvailable.value) {
      search.state.client = 'lazer'
    }
    const isLazer = search.state.client === 'lazer'
    if (!isLazer && stableAvailable.value) {
      commitFilter()
    } else if (isLazer && search.state.lazerCache) {
      commitFilter()
    } else if (isLazer) {
      loading.value = false
    } else {
      error.value = '后端服务不可用'
      loading.value = false
    }
  } catch {
    stableAvailable.value = false
    lazerAvailable.value = false
    error.value = '后端服务不可用'
    loading.value = false
  }
})

async function handleExportCollection(name: string, overwrite: boolean) {
  const hashes = filtered.value.map(b => b.beatmap.md5Hash).filter(Boolean)
  if (hashes.length === 0) return
  const client = search.state.client
  try {
    const endpoint = client === 'lazer'
      ? api.updateLazerCollection({ name, beatmapMd5Hashes: hashes, overwrite })
      : api.updateStableCollection({ name, beatmapMd5Hashes: hashes, overwrite })
    const res = await endpoint
    message.success(`Exported ${res.beatmapCount} beatmaps to "${res.name}"${res.created ? ' (created)' : ' (updated)'}`)
  } catch (e) {
    message.error(String(e))
  }
}
</script>

<template>
  <div class="beatmaps-view">
    <NAlert v-if="error" type="error" :title="error" closable @close="error = null" />
    <SearchPanel
      v-model="search.state" :loading="loading"
      :stable-available="stableAvailable" :lazer-available="lazerAvailable"
      :sr-available="srAvailable" :beatmap-count="filtered.length"
      @commit="commitFilter" @export-collection="handleExportCollection"
    />
    <NH2>Beatmaps ({{ filtered.length }})</NH2>
    <CardGrid :items="filtered" :loading="loading" />
  </div>
</template>

<style scoped>
.beatmaps-view { padding: 0 0 40px; }
</style>
