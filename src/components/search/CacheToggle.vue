<script setup lang="ts">
import { computed } from 'vue'
import { NSwitch } from 'naive-ui'
import { cachedCount as lazerCachedCount } from '@/services/lazer/cache'
import { beatmapEntryCache } from '@/services/stable/cache'

const props = defineProps<{
  modelValue: boolean
  client: 'stable' | 'lazer'
}>()
const emit = defineEmits<{ 'update:modelValue': [v: boolean] }>()

const cacheCount = computed(() =>
  props.client === 'lazer' ? lazerCachedCount() : beatmapEntryCache.initialized ? beatmapEntryCache.value.size : 0,
)
</script>

<template>
  <div class="cache-box">
    <span class="c-label">只从缓存查询</span>
    <NSwitch
      :value="modelValue"
      size="small"
      @update:value="v => emit('update:modelValue', v)"
    />
    <span class="c-count" v-if="cacheCount > 0">{{ cacheCount }} cached</span>
  </div>
</template>

<style scoped>
.cache-box {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border: 1px solid #d9d9d9;
  border-radius: 6px;
  padding: 2px 8px;
  font-size: 12px;
  white-space: nowrap;
  transition: border-color .15s;
}
.c-label {
  color: #888;
}
.c-count {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}
</style>
