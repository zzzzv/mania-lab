<template>
  <template v-if="summary">
    <el-row :gutter="20">
      <el-col>
        <el-statistic
          title="Accuracy"
          :value="summary.accuracy"
          :formatter="formatPercent"
        />
      </el-col>
      <el-col>
        <el-statistic title="Max Combo(no hold ticks)" :value="summary.maxCombo" />
      </el-col>
    </el-row>
    <el-table :data="summary.counts" border show-summary>
      <el-table-column prop="name" label="Result"/>
      <el-table-column prop="rice" label="Rice Notes"/>
      <el-table-column prop="ln" label="Long Notes"/>
      <el-table-column prop="total" label="Total"/>
    </el-table>
  </template>
  <el-empty v-else description="No results to display" />
</template>

<script lang="ts" setup>
import { ElCol } from 'element-plus';
import { computed } from 'vue';
import { osuV1 } from '~/lib/mania-replay/src';
import type { PlayedNote } from '~/lib/mania-replay/src';

const props = defineProps<{
  notes: PlayedNote[];
}>();

const summary = computed(() => {
  if (props.notes.length === 0 || props.notes[0].result === -1) return null;

  const counts = osuV1.nameTable.map(name => ({
    name,
    rice: 0,
    ln: 0,
    total: 0,
  }));
  let totalAcc = 0;
  let totalHits = 0;
  let maxCombo = 0;
  let currentCombo = 0;

  for (const note of props.notes) {
    if (note.end === undefined) {
      counts[note.result].rice += 1;
    } else {
      counts[note.result].ln += 1;
    }
    counts[note.result].total += 1;

    totalAcc += osuV1.accTable[note.result];
    totalHits++;
    if (note.result < osuV1.accTable.length - 1) {
      currentCombo += 1;
      if (currentCombo > maxCombo) {
        maxCombo = currentCombo;
      }
    } else {
      currentCombo = 0;
    }
  }
  return {
    counts,
    totalHits,
    accuracy: totalHits > 0 ? totalAcc / totalHits : 0,
    maxCombo,
  };
});

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

</script>

<style scoped>
</style>