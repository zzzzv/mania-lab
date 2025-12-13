import { defineStore } from 'pinia';

export const useStateStore = defineStore('stateStore', {
  state: () => ({
    selectedBeatmapMD5: null as string | null,
    selectedReplayMD5: null as string | null,
  }),
});