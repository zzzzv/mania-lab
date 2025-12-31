<template>
  <div ref="chartContainer" class="level-chart"></div>
</template>

<script lang="ts" setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue';
import * as echarts from 'echarts';
import { osuV1 } from '~/lib/mania-replay/src';
import type { PlayedNote } from '~/lib/mania-replay/src';

const props = defineProps<{
  notes: PlayedNote[];
}>();

const chartContainer = ref<HTMLDivElement | null>(null);
const chart = ref<echarts.EChartsType | null>(null);
let ro: ResizeObserver | null = null;

function ensureChart() {
  if (!chart.value && chartContainer.value) {
    chart.value = echarts.init(chartContainer.value);
  }
}

function updateChart() {
  if (chart.value && props.notes.length > 0) {
    const levels = osuV1.levelNames.length;
    const rice = new Array(levels).fill(0);
    const ln = new Array(levels).fill(0);

    for (const note of props.notes) {
      if (note.end === undefined) rice[note.level]++;
      else ln[note.level]++;
    }

    const option: echarts.EChartsOption = {
      xAxis: { type: 'category', data: osuV1.levelNames },
      yAxis: { type: 'value', name: 'Count' },
      series: [
        { data: rice, stack: 'total', type: 'bar' },
        { data: ln, stack: 'total', type: 'bar' },
      ],
    };

    chart.value.setOption(option);
  }
}

watch(
  () => props.notes,
  async () => {
    await nextTick();
    console.log('LevelChart: notes updated');
    ensureChart();
    chart.value?.resize();
    updateChart();
  },
  { deep: true }
);

onMounted(async () => {
  await nextTick();
  ensureChart();
  updateChart();

  if (chartContainer.value) {
    ro = new ResizeObserver(() => {
      // Tab 切换后尺寸从 0 变为非 0 时，这里会触发
      ensureChart();
      chart.value?.resize();
    });
    ro.observe(chartContainer.value);
  }
});

onBeforeUnmount(() => {
  ro?.disconnect();
  ro = null;
  chart.value?.dispose();
  chart.value = null;
});
</script>

<style scoped>
.level-chart {
  width: 100%;
  height: 400px; /* 关键：不要让容器高度为 0 */
}
</style>