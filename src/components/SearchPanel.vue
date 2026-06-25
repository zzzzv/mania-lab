<script setup lang="ts">
import { ref, computed } from 'vue'
import { NCollapse, NCollapseItem, NIcon, NSelect, NInput, NTabs, NTab } from 'naive-ui'
import { ChevronRight, ChevronDown } from '@vicons/fa'
import type { SearchState } from './search/types'
import type { SortField } from './search/types'
import SRRangeFilter from './search/SRRangeFilter.vue'
import LazerCacheToggle from './search/LazerCacheToggle.vue'
import LastPlayedFilter from './search/LastPlayedFilter.vue'
import CollectionPanel from './search/CollectionPanel.vue'

const props = defineProps<{ modelValue: SearchState; loading?: boolean; stableAvailable: boolean; lazerAvailable: boolean; srAvailable?: boolean; beatmapCount?: number }>()
const emit = defineEmits<{ 'update:modelValue': [v: SearchState]; commit: []; 'exportCollection': [name: string, overwrite: boolean] }>()

const collapsed = ref(false)

const isAuto = computed(() => props.modelValue.client !== 'lazer' || props.modelValue.lazerCache)

const isFullFetch = computed(() =>
  props.modelValue.client === 'lazer'
  && props.modelValue.query.keys.length === 0
  && props.modelValue.query.rankedStatuses.length === 0
  && props.modelValue.query.searchText.trim() === ''
)

function autoCommit() {
  if (isAuto.value) emit('commit')
}

function emitUpdate(patch: Partial<SearchState>) {
  emit('update:modelValue', { ...props.modelValue, ...patch })
}

function emitQuery(patch: Partial<SearchState['query']>) {
  emitUpdate({ query: { ...props.modelValue.query, ...patch } })
}

function emitFilter(patch: Partial<SearchState['filter']>) {
  emitUpdate({ filter: { ...props.modelValue.filter, ...patch } })
}

const keyOptions = [
  { label: '<4K', value: -1 },
  ...Array.from({ length: 10 }, (_, i) => ({
    label: `${i + 1}K`,
    value: i + 1,
  })),
  { label: '>10K', value: -2 },
]

const statusOptions = [
  { label: 'Unknown', value: 0 },
  { label: 'Unsubmitted', value: 1 },
  { label: 'Pending', value: 2 },
  { label: 'Ranked', value: 4 },
  { label: 'Approved', value: 5 },
  { label: 'Qualified', value: 6 },
  { label: 'Loved', value: 7 },
]

const sortOptions: { label: string; value: SortField }[] = [
  { label: 'Title', value: 'title' },
  { label: 'Artist', value: 'artist' },
  { label: 'Creator', value: 'creator' },
  { label: 'Difficulty', value: 'difficulty' },
  { label: 'Key', value: 'key' },
  { label: 'OD', value: 'OD' },
  { label: 'HP', value: 'HP' },
  { label: 'Length', value: 'lengthMs' },
  { label: 'Status', value: 'rankedStatus' },
  { label: 'Notes', value: 'noteCount' },
  { label: 'Holds', value: 'holdCount' },
  { label: 'BPM', value: 'bpm' },
  { label: 'Score Count', value: 'scores.length' },
  { label: 'SR', value: 'maniaSR.PPY.NM' },
  { label: 'XXY SR', value: 'maniaSR.XXY.NM' },
  { label: 'Modified', value: 'lastModifiedTime' },
]
</script>

<template>
  <div class="search-panel">
    <div class="toolbar">
      <div class="tb-left">
        <span class="toolbar-title" @click="collapsed = !collapsed">Search</span>
        <NTabs
          :value="modelValue.client ?? 'stable'"
          size="small"
          style="min-width:160px"
          @update:value="v => emitUpdate({ client: v })"
        >
          <NTab name="stable" :disabled="!stableAvailable">Stable</NTab>
          <NTab name="lazer" :disabled="!lazerAvailable">Lazer</NTab>
        </NTabs>
      </div>
      <span v-if="!stableAvailable && !lazerAvailable" class="tb-error">后端服务不可用</span>
      <span class="toolbar-toggle" @click="collapsed = !collapsed"><NIcon :size="14"><ChevronRight v-if="collapsed" /><ChevronDown v-else /></NIcon></span>
    </div>

    <NCollapse :expanded-names="collapsed ? [] : ['body']" :show-arrow="false">
      <NCollapseItem name="body">
        <template #header>&nbsp;</template>
        <div class="basic-filter">
          <div v-if="isFullFetch" class="bf-warn">获取全部谱面非常慢，可能会超过半分钟，建议添加筛选条件</div>
          <div class="bf-group">
            <div class="bf-group-title">Query</div>
            <div class="bf-row">
              <span class="bf-label">Key</span>
              <NSelect
                :value="modelValue.query.keys" :options="keyOptions" multiple clearable placeholder="All"
                size="small" style="width:250px"
                @update:value="v => (emitQuery({ keys: v ?? [] }), autoCommit())"
              />
              <span class="bf-label">Status</span>
              <NSelect
                :value="modelValue.query.rankedStatuses" :options="statusOptions" multiple clearable placeholder="All"
                size="small" style="width:320px"
                @update:value="v => (emitQuery({ rankedStatuses: v ?? [] }), autoCommit())"
              />
              <span class="bf-label">Search</span>
              <NInput
                :value="modelValue.query.searchText" placeholder="Keywords…" clearable
                size="small" style="flex:1"
                @update:value="v => emitQuery({ searchText: v ?? '' })"
                @blur="autoCommit"
              />
            </div>
            <div class="bf-row">
              <LastPlayedFilter
                :model-value="modelValue.query.lastPlayed"
                @update:model-value="v => (emitQuery({ lastPlayed: v }), autoCommit())"
              />
              <button v-if="!isAuto" class="btn-query" :disabled="loading" @click.stop="emit('commit')">查询Lazer数据库</button>
              <LazerCacheToggle
                v-if="modelValue.client === 'lazer'"
                :model-value="modelValue.lazerCache"
                @update:lazer-cache="v => emitUpdate({ lazerCache: v })"
              />
            </div>
          </div>
          <div class="bf-group">
            <div class="bf-group-title">Filter</div>
            <div class="bf-row">
              <SRRangeFilter
                :model-value="modelValue.filter.srRange"
                :disabled="srAvailable === false"
                @update:model-value="v => emitFilter({ srRange: v })"
              />

              <span class="bf-label">Score</span>
              <NSelect
                :value="modelValue.filter.scoreMode"
                :options="[
                  { label: 'Overview', value: 'overview' },
                  { label: 'Latest', value: 'latest' },
                  { label: 'Highest Score', value: 'bestScore' },
                  { label: 'Highest Acc', value: 'bestAcc' },
                  { label: 'Highest PP', value: 'bestPP' },
                ]"
                size="small" style="width:140px"
                @update:value="v => emitFilter({ scoreMode: v })"
              />
              <span class="bf-label">Sort</span>
              <NSelect
                :value="modelValue.filter.sortField" :options="sortOptions" clearable placeholder="None"
                size="small" style="width:140px"
                @update:value="v => emitFilter({ sortField: v ?? null })"
              />
            </div>
          </div>
          <div class="bf-group">
            <div class="bf-group-title">Collections</div>
            <CollectionPanel
              :model-value="modelValue"
              :beatmap-count="beatmapCount ?? 0"
              :client="modelValue.client"
              @select="v => emit('update:modelValue', v)"
              @export="(name, overwrite) => emit('exportCollection', name, overwrite)"
            />
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped>
.search-panel { margin-bottom: 16px; border: 1px solid #d9d9d9; border-radius: 8px; overflow: hidden; background: #fff; }
.toolbar { display: flex; align-items: center; gap: 8px; padding: 8px 12px; user-select: none; position: relative; }
.toolbar:hover { background: #f5f5f5; }
.tb-left { display: flex; align-items: center; gap: 8px; margin-right: auto; }
.toolbar-title { font-size: 15px; font-weight: 700; color: #1a1a2e; letter-spacing: 0.3px; cursor: pointer; margin-right: 4px; }
.toolbar-title:hover { color: #333; }
.tb-error { font-size: 12px; color: #e74c3c; font-weight: 500; margin-left: auto; }
.toolbar-toggle { color: #999; display: flex; align-items: center; cursor: pointer; margin: 0 auto; position: absolute; left: 50%; transform: translateX(-50%); }
:deep(.n-collapse) { border: none; }
:deep(.n-collapse-item) { border: none; }
:deep(.n-collapse-item__header) { display: none !important; }
:deep(.n-collapse-item__content-wrapper) { border: none; }
:deep(.n-collapse-item__content-inner) { padding: 0 !important; }
.basic-filter { padding: 8px 12px; display: flex; flex-direction: column; gap: 8px; }
.bf-group { border: 1px solid #e0e0e0; border-radius: 6px; padding: 6px 8px; }
.bf-group-title { font-size: 10px; font-weight: 600; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
.bf-warn { font-size: 12px; color: #e67e22; background: #fef9e7; border: 1px solid #f5deb3; border-radius: 4px; padding: 4px 8px; }
.bf-row { display: flex; align-items: center; gap: 8px; }
.bf-label { font-size: 12px; font-weight: 500; color: #666; white-space: nowrap; }
.btn-query { background: #1a8cff; border: none; border-radius: 4px; color: #fff; cursor: pointer; font-size: 12px; font-weight: 500; padding: 3px 14px; white-space: nowrap; }
.btn-query:hover { background: #0073e6; }
.btn-query:disabled { background: #b0b0b0; cursor: not-allowed; }
</style>
