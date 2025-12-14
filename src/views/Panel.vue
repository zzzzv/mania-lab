<template>
  <div ref="container"></div>
  <el-empty v-if="showEmpty" description="Select a beatmap or replay to view" />
</template>

<script setup lang="ts">
import type { ManiaReplayFrame } from 'osu-mania-stable';
import { onMounted, ref, watch } from 'vue';
import { createPanel } from '~/lib/mania-panel';
import { useBeatmapStore, useReplayStore, useStateStore } from '~/stores';
import { convertBeatmap, convertFrames } from '~/utils/convert';

const container = ref<HTMLDivElement | null>(null);
const showEmpty = ref(true);
let panel: ReturnType<typeof createPanel> | null = null;
const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();
const stateStore = useStateStore();

onMounted(() => {
  if (container.value) {
    panel = createPanel(container.value);
    
    watch(
      () => [stateStore.selectedBeatmapMD5, stateStore.selectedReplayMD5],
      async ([beatmapMD5, replayMD5]) => {
        if (!beatmapMD5 || !panel) {
          showEmpty.value = true;
          return;
        }
        showEmpty.value = false;
        const beatmap = await beatmapStore.readBeatmap(beatmapMD5);
        const convertedBeatmap = convertBeatmap(beatmap);
        let convertedReplay;
        if (replayMD5) {
          const score = await replayStore.readReplay(replayMD5, beatmap);
          const frames = score.replay.frames as ManiaReplayFrame[];
          convertedReplay = convertFrames(convertedBeatmap.keys, frames);
        }
        panel.render(convertedBeatmap, convertedReplay);
      },
      { immediate: true }
    );
  }
});
</script>