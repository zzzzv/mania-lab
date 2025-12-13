<template>
  <el-upload
    drag
    multiple
    accept=".osu,.osr"
    :show-file-list="false"
    :http-request="customRequest"
  >
    <el-icon class="el-icon--upload"><upload-filled /></el-icon>
    <div class="el-upload__text">
      Drop <strong>.osu</strong> or <strong>.osr</strong> files here or <em>click to upload</em>
    </div>
  </el-upload>
</template>

<script lang="ts" setup>
import { UploadFilled } from '@element-plus/icons-vue'
import type { UploadRequestOptions } from 'element-plus';
import { useBeatmapStore, useReplayStore } from '~/stores';

const beatmapStore = useBeatmapStore();
const replayStore = useReplayStore();

async function customRequest(options: UploadRequestOptions) {
  if (options.file.name.endsWith('.osu')) {
    const text = await options.file.text();
    if (text) {
      await beatmapStore.addBeatmap(text);
    }
  } else if (options.file.name.endsWith('.osr')) {
    const buffer = await options.file.arrayBuffer();
    if (buffer) {
      await replayStore.addReplay(buffer);
    }
  }
}
</script>
