<template>
  <div>
    <span>Repository: </span>
    <a href="https://github.com/zzzzv/mania-svg" target="_blank" rel="noopener noreferrer">https://github.com/zzzzv/mania-svg</a>
  </div>
  <div v-html="svg">
    
  </div>
  <el-empty v-if="!svg" description="Select a beatmap to view" />
</template>

<script setup lang="ts">
import { ref, watchEffect } from 'vue';
import { render, type Beatmap } from 'mania-svg';
import { useBeatmapStore, useStateStore } from '~/stores';
import { convertBeatmap } from '~/utils/convert';

const beatmapStore = useBeatmapStore();
const stateStore = useStateStore();
const svg = ref<string>('');

watchEffect(async () => {
  const beatmapMD5 = stateStore.selectedBeatmapMD5;
  if (!beatmapMD5) {
    svg.value = '';
    return;
  }

  const beatmap = await beatmapStore.readBeatmap(beatmapMD5);
  const data = convertBeatmap(beatmap);
  const svgData: Beatmap = { ...data, objects: data.notes };

  svg.value = render(svgData, {
    strip: {
      mode: 'num',
      num: 8,
    },
  });
});
</script>