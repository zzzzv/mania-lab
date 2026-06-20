<script setup lang="ts">
import { computed } from 'vue'
import { RankedStatuses } from 'osu-stable-db'
import type { RankedStatus } from 'osu-stable-db'

const props = defineProps<{ status: RankedStatus }>()

const statusLabels = Object.fromEntries(
  Object.entries(RankedStatuses).map(([k, v]) => [v, k]),
)

const entry = computed(() =>
  Object.entries(RankedStatuses).find(([, v]) => v === props.status),
)

const cls = computed(() =>
  entry.value ? `s-${entry.value[0].toLowerCase()}` : '',
)

const label = computed(() =>
  statusLabels[props.status] ?? 'Unknown',
)
</script>

<template>
  <span :class="['sb', cls]">{{ label }}</span>
</template>

<style>
.sb {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 3px;
  color: #fff;
}
.s-pending { background: #7f8c8d; }
.s-ranked  { background: #27ae60; }
.s-approved { background: #2980b9; }
.s-qualified { background: #8e44ad; }
.s-loved   { background: #d35400; }
.s-unknown,
.s-unsubmitted,
.s-unused   { background: #888; }
</style>
