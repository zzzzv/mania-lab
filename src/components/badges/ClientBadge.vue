<script setup lang="ts">
import type { Client } from '@/models'

defineProps<{ client: Client }>()
</script>

<template>
  <span :class="['cb', `cb-${client}`]">{{ client }}</span>
</template>

<style>
.cb {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 2px 5px;
  border-radius: 3px;
  text-transform: uppercase;
}
.cb-stable { background: #2b5fd9; color: #fff; }
.cb-lazer  { background: #d4a017; color: #fff; }
</style>
