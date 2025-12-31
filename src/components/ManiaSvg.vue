<template>
  <div v-html="svg"></div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { render } from 'mania-svg';
import type { Beatmap, Options, DeepPartial } from 'mania-svg';

const props = defineProps<{
  beatmap: Beatmap;
  options: DeepPartial<Options>;
}>();

const svg = computed(() => render(props.beatmap, props.options));
</script>