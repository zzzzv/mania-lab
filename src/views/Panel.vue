<template>
  <el-container>
    <template v-if="stateStore.selectedBeatmapMD5">
      <mania-panel :options="options" v-on:update="contextUpdate" />
      <el-tabs type="border-card" v-model="activeTab">
        <el-tab-pane label="Options" name="options">
          <options-editor :template="template" v-on:update="options = $event"/>
        </el-tab-pane>
        <el-tab-pane label="Stats" name="stats">
          <result-table :playResult="context?.replay.playResult ?? null" />
        </el-tab-pane>
        <el-tab-pane label="Context" name="context">
          <json-viewer :value="context ?? {}" :expand-depth="2" />
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-empty v-else description="Select a beatmap or replay to view" />
  </el-container>
</template>

<script setup lang="ts">
import { ManiaRuleset } from 'osu-mania-stable';
import type { ManiaReplayFrame } from 'osu-mania-stable';
import { ref, watch, shallowRef, triggerRef } from 'vue';
import type { ReplayFrame, Mod } from '~/lib/mania-replay/src';
import { useBeatmapStore, useReplayStore, useStateStore } from '~/stores';
import { convertBeatmap, convertFrames } from '~/utils/convert';
import type { Options, DeepPartial, Context } from '~/lib/mania-panel';
import ManiaPanel from '~/components/ManiaPanel.vue';
import OptionsEditor from '~/components/OptionsEditor.vue';
import optionsTemplate from '~/templates/panel-options.json5?raw';
import ResultTable from '~/components/charts/ResultTable.vue';
import { JsonViewer } from 'vue3-json-viewer';
import { ElMessage } from 'element-plus';

const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();
const stateStore = useStateStore();
const template = optionsTemplate; // avoid build error

const activeTab = ref('options');
const options = ref<DeepPartial<Options>>({});

const context = shallowRef<Context | null>(null);

function contextUpdate(value: Context) {
  context.value = value;
  triggerRef(context);
}

watch(
  () => stateStore.selectedBeatmapMD5,
  async (beatmapMD5) => {
    if (!beatmapMD5) return;

    const rawBeatmap = await beatmapStore.readBeatmap(beatmapMD5);
    const beatmap = convertBeatmap(rawBeatmap);
    options.value = {
      beatmap: beatmap,
      replay: {
        frames: [] as ReplayFrame[],
      }
    };
  },
);

watch(
  () => stateStore.selectedReplayMD5,
  async (replayMD5) => {
    if (!replayMD5) return;

    const ruleset = new ManiaRuleset();
    const rawBeatmap = await beatmapStore.readBeatmap(stateStore.selectedBeatmapMD5!);
    const score = await replayStore.readReplay(replayMD5, rawBeatmap);
    const mods = ruleset.createModCombination(score.info.rawMods);

    const maniaBeatmap = ruleset.applyToBeatmapWithMods(rawBeatmap, mods);
    if (mods.has('HR') || mods.has('EZ')) {
      maniaBeatmap.difficulty.overallDifficulty = rawBeatmap.difficulty.overallDifficulty;
    }
    const beatmap = convertBeatmap(maniaBeatmap);

    const rawFrames = score.replay.frames as ManiaReplayFrame[];
    const frames = convertFrames(beatmap.keys, rawFrames);

    const mod = mods.has('EZ') ? 'EZ' :
                mods.has('HR') ? 'HR' : 'NM';
    options.value = {
      beatmap: beatmap,
      replay: {
        frames: frames,
        mod: mod as Mod,
      }
    };

    const hasLN = beatmap.notes.some(note => note.end);
    if (hasLN) {
      ElMessage({
        message: 'Osu V1 LN support is WIP and not accurate.',
        type: 'warning',
        duration: 5000,
        showClose: true,
        grouping: true,
      });
    }
  },
);
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