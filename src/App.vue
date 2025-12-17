<template>
  <el-container>
    <el-aside width="500px">
      <side-bar />
    </el-aside>
    <el-main>
      <RouterView />
    </el-main>
  </el-container>
</template>

<script setup lang="ts">
import SideBar from '~/layouts';
</script>

<style scoped>
.el-container {
  height: 100%;
}

.el-main {
  padding: 5px;
}
</style>

<style>
html, body, #app {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
</style>