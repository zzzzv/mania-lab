<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ grade: number }>()

const GRADE_LABELS = ['SS', 'SS', 'S', 'S', 'A', 'B', 'C', 'D', 'F']
const label = computed(() => GRADE_LABELS[props.grade] ?? '')
</script>

<template>
  <span class="grade" :class="`grade-${grade}`">{{ label }}</span>
</template>

<style scoped>
.grade { font-weight: 700; }
.grade-0, .grade-1 { color: #c0c0c0; }
.grade-2, .grade-3 { color: #ffcc22; }
.grade-4 { color: #88b300; }
.grade-5 { color: #3399dd; }
.grade-6 { color: #aa66dd; }
.grade-7 { color: #dd4477; }
.grade-8 { color: #888; }
</style>
