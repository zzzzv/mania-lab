<script setup lang="ts">
import { computed } from 'vue'
import { NSwitch } from 'naive-ui'
import { cachedCount } from '@/services/lazer/cache'

const props = defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{ 'update:lazerCache': [v: boolean] }>()

const cacheCount = computed(() => cachedCount())
</script>

<template>
  <div class="lazer-cache-box">
    <span class="lc-label">只从缓存查询</span>
    <NSwitch
      :value="modelValue"
      size="small"
      @update:value="v => emit('update:lazerCache', v)"
    />
    <span class="lc-count" v-if="cacheCount > 0">{{ cacheCount }} cached</span>
  </div>
</template>

<style scoped>
.lazer-cache-box {
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
.lc-label {
  color: #888;
}
.lc-count {
  font-size: 11px;
  color: #999;
  white-space: nowrap;
}
.lc-lock {
  font-size: 10px;
  line-height: 1;
}
</style>
