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

const props = defineProps<{
  playResult: osuV1.PlayResult | null;
}>();

const summary = computed(() => {
  if (!props.playResult || props.playResult.notes.length === 0) return null;

  const counts = osuV1.nameTable.map(name => ({
    name,
    rice: 0,
    ln: 0,
    total: 0,
  }));

  for (const note of props.playResult.notes) {
    if (note.end === undefined) {
      counts[note.result.level].rice += 1;
    } else {
      counts[note.result.level].ln += 1;
    }
    counts[note.result.level].total += 1;
  }
  return {
    counts,
    accuracy: osuV1.calcAccuracy(props.playResult),
    maxCombo: osuV1.calcMaxCombo(props.playResult),
  };
});

const formatPercent = (value: number) => `${(value * 100).toFixed(2)}%`;

</script>

<style scoped>
</style>