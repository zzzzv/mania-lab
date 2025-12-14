<template>
  <el-menu
    mode="horizontal"
    :default-active="activeIndex"
  >
    <el-menu-item index="/home">
      <RouterLink to="/home">Home</RouterLink>
    </el-menu-item>
    <el-menu-item index="/svg">
      <RouterLink to="/svg">SVG</RouterLink>
    </el-menu-item>
    <el-menu-item index="/panel">
      <RouterLink to="/panel">Panel</RouterLink>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeIndex = computed(() => {
  return route.path === '/' ? '/panel' : route.path
})
</script>