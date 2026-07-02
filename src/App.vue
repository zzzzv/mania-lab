<script setup lang="ts">
import { RouterView } from 'vue-router'
import { NConfigProvider, NMenu, NMessageProvider } from 'naive-ui'
import { h } from 'vue'
import { RouterLink } from 'vue-router'
import SettingsDialog from '@/components/SettingsDialog.vue'

const menuOptions = [
  {
    label: () => h(RouterLink, { to: '/' }, { default: () => 'Beatmaps' }),
    key: 'beatmaps',
  },
]
</script>

<template>
  <NConfigProvider>
    <NMessageProvider>
    <div class="layout">
      <header class="topbar">
        <div class="topbar-inner">
          <span class="logo">mania-lab</span>
          <NMenu mode="horizontal" :options="menuOptions" />
          <div class="topbar-right">
            <SettingsDialog />
          </div>
        </div>
      </header>
      <main class="content">
        <RouterView />
      </main>
    </div>
    </NMessageProvider>
  </NConfigProvider>
</template>

<style scoped>
.topbar-right {
  margin-left: auto;
  display: flex;
  align-items: center;
}
</style>

