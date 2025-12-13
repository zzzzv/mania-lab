import { defineStore } from 'pinia';
import { get, set, del } from 'idb-keyval';
import { BeatmapDecoder } from 'osu-parsers';
import { ManiaRuleset } from 'osu-mania-stable';
import { md5 } from 'js-md5';
import type { BeatmapInfo } from '~/types/store';

const ruleset = new ManiaRuleset();
const beatmapDecoder = new BeatmapDecoder();

export const useBeatmapStore = defineStore('beatmapStore', {
  state: () => ({
    items: [] as BeatmapInfo[],
  }),

  actions: {
    async addBeatmap(content: string) {
      const hash = md5(content);

      if (!await get<string>(hash)) {
        await set(hash, content);
      }

      if (!this.items.find(b => b.md5 === hash)) {
        const beatmap = beatmapDecoder.decodeFromString(
          content,
          { parseHitObjects: false, parseStoryboard: false }
        );
        this.items.push({
          md5: hash,
          title: beatmap.metadata!.titleUnicode,
          version: beatmap.metadata!.version,
          uploadedAt: new Date().toISOString(),
        });
      }
    },

    async readBeatmap(md5: string) {
      const content = await get<string>(md5);
      if (!content) {
        throw new Error(`Beatmap with MD5 ${md5} not found in storage.`);
      }

      const beatmap = beatmapDecoder.decodeFromString(
        content,
        { parseStoryboard: false }
      );
      return ruleset.applyToBeatmap(beatmap);
    },

    async removeBeatmap(md5: string) {
      await del(md5);
      this.items.splice(this.items.findIndex(b => b.md5 === md5), 1);
    },

    async clearAll() {
      for (const beatmap of this.items) {
        await this.removeBeatmap(beatmap.md5);
      }
      this.items = [];
    }
  }, 
  persist: true,
});