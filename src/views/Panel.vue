<template>
  <el-container>
    <template v-if="stateStore.selectedBeatmapMD5">
      <mania-panel :options="options" v-on:update="contextUpdate" />
      <el-tabs type="border-card" v-model="activeTab">
        <el-tab-pane label="Options" name="options">
          <options-editor :template="template" v-on:update="options = $event"/>
        </el-tab-pane>
        <el-tab-pane label="Stats" name="stats">
          <result-table :notes="playedNotes" />
        </el-tab-pane>
      </el-tabs>
    </template>
    <el-empty v-else description="Select a beatmap or replay to view" />
  </el-container>
</template>

<script setup lang="ts">
import type { ManiaReplayFrame } from 'osu-mania-stable';
import { ref, watch } from 'vue';
import type { ReplayFrame, Mod, PlayedNote } from '~/lib/mania-replay/src';
import { useBeatmapStore, useReplayStore, useStateStore } from '~/stores';
import { convertBeatmap, convertFrames } from '~/utils/convert';
import type { Options, DeepPartial, Context } from '~/lib/mania-panel';
import ManiaPanel from '~/components/ManiaPanel.vue';
import OptionsEditor from '~/components/OptionsEditor.vue';
import optionsTemplate from '~/templates/panel-options.json5?raw';
import ResultTable from '~/components/charts/ResultTable.vue';

const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();
const stateStore = useStateStore();
const template = optionsTemplate; // avoid build error

const activeTab = ref('options');
const options = ref<DeepPartial<Options>>({});
const playedNotes = ref<PlayedNote[]>([]);

function contextUpdate(value: Context) {
  const notes = value.beatmap.notes;
  if (notes.length > 0 && notes[0].result !== -1) {
    playedNotes.value = notes;
  } else {
    playedNotes.value = [] as PlayedNote[];
  }
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

    const rawBeatmap = await beatmapStore.readBeatmap(stateStore.selectedBeatmapMD5!);
    const beatmap = convertBeatmap(rawBeatmap);
    const newOptions: DeepPartial<Options> = {
      beatmap: beatmap,
      replay: {
        frames: [] as ReplayFrame[],
        mod: 'nm' as Mod,
      },
    }
    if (replayMD5) {
      const score = await replayStore.readReplay(replayMD5, rawBeatmap);
      const rawFrames = score.replay.frames as ManiaReplayFrame[];
      newOptions.replay!.frames = convertFrames(beatmap.keys, rawFrames);
      const mods = replayStore.items.find(r => r.replayMD5 === replayMD5)!.mods;
      newOptions.replay!.mod = mods.includes('EZ') ? 'ez' :
                           mods.includes('HR') ? 'hr' : 'nm';
    }
    options.value = newOptions;
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