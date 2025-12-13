<template>
  <div ref="container">

  </div>
</template>

<script setup lang="ts">
import { onMounted, ref, watch } from 'vue';
import { createPanel } from '~/lib/mania-panel';
import { useBeatmapStore, useStateStore } from '~/stores';
import { convertToLibStruct } from '~/utils/beatmap';

const container = ref<HTMLDivElement | null>(null);
let panel: ReturnType<typeof createPanel> | null = null;
const beatmapStore = useBeatmapStore();
const stateStore = useStateStore();

onMounted(() => {
  if (container.value) {
    panel = createPanel(container.value);
    
    watch(
      () => stateStore.selectedBeatmapMD5,
      async (beatmapMD5) => {
        if (!beatmapMD5 || !panel) {
          return;
        }

        const beatmap = await beatmapStore.readBeatmap(beatmapMD5);
        const data = convertToLibStruct(beatmap);
        panel.render(data);
      },
      { immediate: true }
    );
  }
});
</script>