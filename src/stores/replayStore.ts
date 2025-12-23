import { defineStore } from 'pinia';
import { get, set, del } from 'idb-keyval';
import { ScoreDecoder } from 'osu-parsers';
import { type IMod, ModBitwise, ModType } from 'osu-classes';
import { ManiaRuleset, ManiaBeatmap, ManiaModCombination } from 'osu-mania-stable';
import { md5 } from 'js-md5';
import type { ReplayInfo } from '~/types/store';


const ruleset = new ManiaRuleset();
const scoreDecoder = new ScoreDecoder();

class ManiaScoreV2 implements IMod {
  name = 'ScoreV2';

  acronym = 'V2';

  bitwise: ModBitwise = ModBitwise.ScoreV2;

  type: ModType = ModType.System;

  multiplier = 1;

  isRanked = false;

  incompatibles: ModBitwise = ModBitwise.None;

  isUserPlayable = true;
}

class ManiaModCombinationV2 extends ManiaModCombination {
  protected get _availableMods(): IMod[] {
    return [...super._availableMods, new ManiaScoreV2()];
  }
}

export const useReplayStore = defineStore('replayStore', {
  state: () => ({
    items: [] as ReplayInfo[],
  }),

  actions: {
    async addReplay(buffer: ArrayBuffer) {
      const hash = md5(buffer);

      if (!await get<ArrayBuffer>(hash)) {
        await set(hash, buffer);
      }

      if (!this.items.find(r => r.replayMD5 === hash)) {
        const score = await scoreDecoder.decodeFromBuffer(buffer, false);
        const mods = new ManiaModCombinationV2(score.info.rawMods);
        this.items.push({
          replayMD5: hash,
          beatmapMD5: score.info.beatmapHashMD5,
          player: score.info.username,
          score: score.info.totalScore,
          accuracy: score.info.accuracy,
          mods: mods.acronyms,
          playedAt: score.info.date.toISOString(),
          uploadedAt: new Date().toISOString(),
        });
      }
    },

    async readReplay(md5: string, beatmap: ManiaBeatmap) {
      const buffer = await get<ArrayBuffer>(md5);
      if (!buffer) {
        throw new Error(`Replay with MD5 ${md5} not found in storage.`);
      }

      const score = await scoreDecoder.decodeFromBuffer(buffer, true);
      const replay =  ruleset.applyToReplay(score.replay!, beatmap);
      return {
        info: score.info,
        replay,
      }
    },

    async removeReplay(md5: string) {
      await del(md5);
      this.items.splice(this.items.findIndex(r => r.replayMD5 === md5), 1);
    },

    async clearAll() {
      for (const replay of this.items) {
        await this.removeReplay(replay.replayMD5);
      }
      this.items = [];
    }
  }, 
  persist: true,
});