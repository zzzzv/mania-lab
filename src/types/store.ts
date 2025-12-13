export interface OsuFile {
  uploadedAt: string;
}

export interface BeatmapInfo extends OsuFile {
  md5: string;
  title: string;
  version: string;
}

export interface ReplayInfo extends OsuFile {
  replayMD5: string;
  beatmapMD5: string;
  player: string;
  score: number;
  accuracy: number;
  playedAt: string;
}