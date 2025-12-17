<template>
  <el-container>
    <div ref="panelContainer"></div>
    <template v-if="stateStore.selectedBeatmapMD5">
      <el-tabs type="border-card">
        <el-tab-pane label="Options">
          <options-editor :template="template" v-on:update="updateOptions"/>
        </el-tab-pane>
        <el-tab-pane label="Stats">
          Stats
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-empty v-else description="Select a beatmap or replay to view" />
  </el-container>
</template>

<script setup lang="ts">
import type { ManiaReplayFrame } from 'osu-mania-stable';
import { onMounted, ref, watch } from 'vue';
import { createPanel } from '~/lib/mania-panel';
import { useBeatmapStore, useReplayStore, useStateStore } from '~/stores';
import { convertBeatmap, convertFrames } from '~/utils/convert';
import OptionsEditor from '~/components/OptionsEditor.vue';
import optionsTemplate from '~/templates/panel-options.json5?raw';

const panelContainer = ref<HTMLDivElement | null>(null);
let panel: ReturnType<typeof createPanel> | null = null;
const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();
const stateStore = useStateStore();
const template = optionsTemplate; // avoid build error

const updateOptions = (newOptions: object) => {
  if (panel) {
    panel.setOptions(newOptions);
    panel.render();
  }
};

onMounted(() => {
  if (panelContainer.value) {
    const containerHeight = panelContainer.value.clientHeight;
    panel = createPanel(panelContainer.value);
    panel.setOptions({
      canvas: {
        height: containerHeight,
      },
    });

    const resizeObserver = new ResizeObserver(() => {
      if (panel && panelContainer.value && stateStore.selectedBeatmapMD5) {
        panel.setOptions({
          canvas: {
            height: panelContainer.value.clientHeight,
          },
        });
        panel.render();
      }
    });
    resizeObserver.observe(panelContainer.value);
    
    watch(
      () => stateStore.selectedBeatmapMD5,
      async (beatmapMD5) => {
        if (!beatmapMD5 || !panel) {
          return;
        }
        const rawBeatmap = await beatmapStore.readBeatmap(beatmapMD5);
        const beatmap = convertBeatmap(rawBeatmap);
        panel.setOptions({
          beatmap: beatmap,
          replay: { frames: [] },
        });
        panel.render();
      },
      { immediate: true }
    );

    watch(
      () => stateStore.selectedReplayMD5,
      async (replayMD5) => {
        if (!replayMD5 || !panel) {
          return;
        }
        const rawBeatmap = await beatmapStore.readBeatmap(stateStore.selectedBeatmapMD5!);
        const beatmap = convertBeatmap(rawBeatmap);
        let frames;
        if (replayMD5) {
          const score = await replayStore.readReplay(replayMD5, rawBeatmap);
          const rawFrames = score.replay.frames as ManiaReplayFrame[];
          frames = convertFrames(beatmap.keys, rawFrames);
        }
        panel.setOptions({
          beatmap: beatmap,
          replay: {
            frames,
          },
        })
        panel.render();
      },
      { immediate: true }
    );
  }
});
</script>

<style scoped>
.el-container {
  height: 100%;
}

.el-tabs {
  flex: 1;
}

:deep(.el-tabs__content) {
  display: flex;
  padding: 5px;
}

.el-tab-pane {
  flex: 1;
  overflow: auto;
}

.el-empty {
  flex: 1;
}

</style>