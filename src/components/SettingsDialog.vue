<script setup lang="ts">
import { ref } from 'vue'
import { NModal, NCard, NSwitch, NRadioGroup, NRadioButton, NSelect } from 'naive-ui'
import { useSettingsStore } from '@/stores/settings'
import type { SRDisplayMode } from '@/stores/settings'

const store = useSettingsStore()
const show = ref(false)

const srModeOptions: { label: string; value: SRDisplayMode }[] = [
  { label: 'PPY.NM + XXY.NM', value: 'dual-nm' },
  { label: 'PPY.HT + XXY.HT', value: 'dual-ht' },
  { label: 'PPY.DT + XXY.DT', value: 'dual-dt' },
  { label: 'PPY: NM HT DT', value: 'ppy-all' },
  { label: 'XXY: NM HT DT', value: 'xxy-all' },
]
</script>

<template>
  <button class="settings-trigger" title="设置" @click="show = true">
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1.08-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1.08 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1.08 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1.08z" />
    </svg>
    <span>设置</span>
  </button>

  <NModal v-model:show="show" preset="card" title="设置" style="max-width:420px">
    <div class="settings-body">
      <div class="setting-row">
        <span class="setting-label">显示 Unicode 曲名/曲师</span>
        <NSwitch :value="store.useUnicode" @update:value="v => store.useUnicode = v" />
      </div>
      <div class="setting-row">
        <span class="setting-label">Score 排序优先级</span>
        <NRadioGroup :value="store.scorePriority" @update:value="v => store.scorePriority = v">
          <NRadioButton value="accuracy" label="Acc" />
          <NRadioButton value="score" label="Score" />
        </NRadioGroup>
      </div>
      <div class="setting-row">
        <span class="setting-label">SR 显示模式</span>
        <NSelect
          :value="store.srDisplayMode" :options="srModeOptions"
          size="small" style="width:200px"
          @update:value="v => store.srDisplayMode = v"
        />
      </div>
    </div>
  </NModal>
</template>

<style scoped>
.settings-trigger {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px 10px;
  border-radius: 4px;
  font-size: 13px;
  white-space: nowrap;
  transition: color .15s, background .15s;
}
.settings-trigger:hover {
  color: #333;
  background: #e8e8e8;
}
.settings-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 4px 0;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.setting-label {
  font-size: 14px;
  color: #333;
  white-space: nowrap;
}
</style>
