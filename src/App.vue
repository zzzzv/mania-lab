<template>
  <div class="common-layout">
    <el-container>
      <el-aside width="500px">
        <side-bar />
      </el-aside>
      <el-container>
        <el-main>
          <RouterView />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup lang="ts">
import SideBar from '~/layouts';
</script>