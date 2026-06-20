<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { NSpin, NEmpty } from 'naive-ui'
import type { CardItem } from '@/models'

import BeatmapCard from './BeatmapCard.vue'
import ScoreCard from './ScoreCard.vue'

const props = defineProps<{
  items: CardItem[]
  loading?: boolean
}>()

const emit = defineEmits<{
  select: [item: CardItem]
}>()

const PAGE_SIZE = 20
const MAX_PAGES = 10  // 200 cards limit
const sentinel = ref<HTMLDivElement | null>(null)
let observer: IntersectionObserver | null = null

const page = ref(0)
const overridden = ref(false)

const visible = computed(() => {
  const cap = overridden.value ? Infinity : MAX_PAGES * PAGE_SIZE
  return props.items.slice(0, Math.min((page.value + 1) * PAGE_SIZE, cap))
})

const hasMore = computed(() => visible.value.length < props.items.length)
const showLimitMsg = computed(() => !overridden.value && page.value >= MAX_PAGES && hasMore.value)

const beatmapItems = computed(() =>
  visible.value.filter(d => d.selectedScoreIndex == null),
)
const scoreItems = computed(() =>
  visible.value.filter(d => d.selectedScoreIndex != null),
)

function loadMore() {
  if (hasMore.value) page.value++
}

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      if (entry?.isIntersecting) loadMore()
    },
    { rootMargin: '400px' },
  )
})

// Track the sentinel element reactively
watch(sentinel, (el) => {
  observer?.disconnect()
  if (el) observer?.observe(el)
}, { flush: 'post' })

onUnmounted(() => {
  observer?.disconnect()
})
</script>

<template>
  <div class="card-grid">
    <NSpin v-if="loading" size="large" />
    <NEmpty v-else-if="items.length === 0" description="暂无数据" />
    <div v-else class="grid">
      <BeatmapCard
        v-for="d in beatmapItems"
        :key="d.beatmap.md5Hash"
        :beatmap="d.beatmap"
        @click="emit('select', d)"
      />
      <ScoreCard
        v-for="d in scoreItems"
        :key="`${d.beatmap.md5Hash}-${d.selectedScoreIndex}`"
        :beatmap="d.beatmap"
        :selected-score-index="d.selectedScoreIndex!"
        @click="emit('select', d)"
      />
      <div v-if="hasMore && !showLimitMsg" ref="sentinel" class="sentinel" />
      <div v-if="showLimitMsg" class="limit-msg">
        <span>已显示较多结果，建议添加筛选条件缩小范围</span>
        <button class="btn-continue" @click="overridden = true">继续加载全部</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-grid { width: 100%; }
.grid { display: flex; flex-wrap: wrap; gap: 12px; }
.sentinel { width: 100%; height: 1px; }
.limit-msg { width: 100%; text-align: center; padding: 24px 0; font-size: 13px; color: #888; display: flex; flex-direction: column; align-items: center; gap: 8px; }
.btn-continue { background: none; border: 1px solid #ccc; border-radius: 4px; padding: 4px 16px; font-size: 12px; color: #666; cursor: pointer; }
.btn-continue:hover { background: #f5f5f5; border-color: #999; }
</style>