<template>
  <el-container>
    <template v-if="svg">
      <div v-html="svg"></div>
      <options-editor class="editor" :template="template" v-on:update="updateOptions" />
    </template>
    <el-empty v-else description="Select a beatmap to view" />
  </el-container>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { render } from 'mania-svg';
import { useBeatmapStore, useStateStore } from '~/stores';
import { convertBeatmap } from '~/utils/convert';
import OptionsEditor from '~/components/OptionsEditor.vue';
import optionsTemplate from '~/templates/svg-options.json5?raw';

const beatmapStore = useBeatmapStore();
const stateStore = useStateStore();
const svg = ref<string>('');
const template = optionsTemplate; // avoid build error
let data: ReturnType<typeof convertBeatmap> | null = null;
let options = {};

const renderSVG = () => {
  if (data) {
    svg.value = render(data, options as any);
  } else {
    svg.value = '';
  }
};

const updateOptions = (newOptions: object) => {
  options = newOptions;
  renderSVG();
};

watch(
  () => stateStore.selectedBeatmapMD5,
  async (beatmapMD5) => {
    if (beatmapMD5) {
      const beatmap = await beatmapStore.readBeatmap(beatmapMD5);
      data = convertBeatmap(beatmap);
    } else {
      data = null;
    }
    renderSVG();
  },
  { immediate: true }
);
</script>

<style scoped>
.el-empty {
  flex: 1;
}
</style>