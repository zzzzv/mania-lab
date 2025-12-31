<template>
  <el-container>
    <template v-if="beatmapData">
      <mania-svg :beatmap="beatmapData" :options="options" />
      <options-editor class="editor" :template="template" v-on:update="options = $event" />
    </template>
    <el-empty v-else description="Select a beatmap to view" />
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useBeatmapStore, useStateStore } from '~/stores';
import { convertBeatmap } from '~/utils/convert';
import type { Beatmap, Options, DeepPartial } from 'mania-svg';
import ManiaSvg from '~/components/ManiaSvg.vue';
import OptionsEditor from '~/components/OptionsEditor.vue';
import optionsTemplate from '~/templates/svg-options.json5?raw';

const beatmapStore = useBeatmapStore();
const stateStore = useStateStore();

const template = optionsTemplate; // avoid build error
let beatmapData = ref<Beatmap | null>(null);
let options = ref<DeepPartial<Options>>({});

watch(
  () => stateStore.selectedBeatmapMD5,
  async (beatmapMD5) => {
    if (beatmapMD5) {
      const beatmap = await beatmapStore.readBeatmap(beatmapMD5);
      beatmapData.value = convertBeatmap(beatmap);
    } else {
      beatmapData.value = null;
    }
  },
  { immediate: true }
);
</script>

<style scoped>
.el-empty {
  flex: 1;
}
</style>