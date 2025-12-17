<template>
  <el-card body-style="padding: 0;">
    <template #header>
      <div class="card-header">
        <span>Files</span>
        <el-button
          style="float: right"
          type="text"
          @click="clearAll"
        >
          Clear All
        </el-button>
      </div>
    </template>
    <el-tree
      :data="tree"
      accordion
      node-key="key"
      highlight-current
      @node-click="handleNodeClick"
    >
      <template #default="{ node, data }">
        <span>
          <el-button
            style="margin-left: 4px"
            type="danger"
            link
            @click="remove(node, data)"
          >
            X
          </el-button>
        </span>
        <span class="tree-label">{{ data.label }}</span>
      </template>
    </el-tree>
    <template #footer>
      <div class="card-footer">
        Total Beatmaps: {{ beatmapStore.items.length }},
        Total Replays: {{ replayStore.items.length }}
      </div>
    </template>
  </el-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import type { TreeNode } from 'element-plus';
import { useBeatmapStore, useReplayStore, useStateStore } from '~/stores';

const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();
const stateStore = useStateStore();

interface NodeData {
  key: string;
  label: string;
  type: 'beatmap' | 'replay';
  parent?: NodeData;
  children?: NodeData[];
}

const tree = computed((): NodeData[] => {
  const beatmapMap = new Map<string, NodeData>();
  beatmapStore.items.forEach(bm => {
    beatmapMap.set(bm.md5, {
      key: bm.md5,
      label: `${bm.title} [${bm.version}]`,
      type: 'beatmap',
      children: [],
    });
  });

  const replaysWithoutBeatmap: NodeData[] = [];
  replayStore.items.forEach(rp => {
    const replayNode: NodeData = {
      key: rp.replayMD5,
      label: `${rp.player} - ${rp.playedAt}`,
      type: 'replay',
    };

    const beatmapNode = beatmapMap.get(rp.beatmapMD5);
    if (beatmapNode) {
      replayNode.parent = beatmapNode;
      beatmapNode.children!.push(replayNode);
    } else {
      replayNode.label += ' (No Beatmap)';
      replaysWithoutBeatmap.push(replayNode);
    }
  });

  return [...Array.from(beatmapMap.values()), ...replaysWithoutBeatmap];
});

function handleNodeClick(data: NodeData, _: TreeNode) {
  if (data.type === 'beatmap') {
    stateStore.selectedBeatmapMD5 = data.key;
    stateStore.selectedReplayMD5 = null;
  } else if (data.type === 'replay') {
    stateStore.selectedBeatmapMD5 = data.parent?.key || null;
    stateStore.selectedReplayMD5 = data.key;
  }
}

function remove(_: TreeNode, data: NodeData) {
  if (data.type === 'beatmap') {
    if (stateStore.selectedBeatmapMD5 === data.key) {
      stateStore.selectedBeatmapMD5 = null;
      stateStore.selectedReplayMD5 = null;
    }
    beatmapStore.removeBeatmap(data.key);
  } else if (data.type === 'replay') {
    if (stateStore.selectedReplayMD5 === data.key) {
      stateStore.selectedReplayMD5 = null;
    }
    replayStore.removeReplay(data.key);
  }
}

function clearAll() {
  stateStore.selectedBeatmapMD5 = null;
  stateStore.selectedReplayMD5 = null;
  beatmapStore.clearAll();
  replayStore.clearAll();
}

</script>
