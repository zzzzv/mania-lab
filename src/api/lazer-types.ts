// ──────────────────────────────────────────────
// Lazer Realm object types.
// All expandable fields are `string | ExpandedType`
// since the backend's `noExpand` may keep them flat.
// ──────────────────────────────────────────────

// ── Shared sub-types ──

export interface BeatmapInfoRuleset {
  ShortName: string
  OnlineID: number
  Name: string
  InstantiationInfo: string
  LastAppliedDifficultyVersion: number
  Available: boolean
}

export interface BeatmapDifficulty {
  DrainRate: number
  CircleSize: number
  OverallDifficulty: number
  ApproachRate: number
  SliderMultiplier: number
  SliderTickRate: number
}

export interface BeatmapMetadata {
  Title: string
  TitleUnicode: string
  Artist: string
  ArtistUnicode: string
  Author: string | RealmUserInfo
  Source: string
  Tags: string
  UserTags: string | string[]
  PreviewTime: number
  AudioFile: string
  BackgroundFile: string
}

export interface BeatmapUserSettings {
  Offset: number
}

export interface RealmNamedFileUsage {
  File: string
  Filename: string
}

export interface LazerBeatmapSetFile {
  File: string | { Hash: string; Usages?: string }
  Filename: string
}

export interface LazerBeatmapSet {
  ID: string
  OnlineID: number
  DateAdded: string
  DateSubmitted: string
  DateRanked: string
  Metadata: string
  Beatmaps: string | string[]
  Files: string | LazerBeatmapSetFile[]
  Status: number
  StatusInt: number
  DeletePending: boolean
  Hash: string
  Protected: boolean
  MaxStarDifficulty: number
  MaxLength: number
  MaxBPM: number
  AllBeatmapsUpToDate: boolean
}

export interface LazerCollection {
  ID: string
  Name: string
  BeatmapMD5Hashes: string | string[]
  LastModified: string
}

export interface RealmUserInfo {
  OnlineID: number
  Username: string
  CountryCode: number
  CountryString: string
  IsBot: boolean
}

export interface RealmUserDetail {
  Id: number
  Username: string
  CountryCode: number
  IsBot: boolean
  Statistics: Record<string, unknown>
  OnlineID: number
}

export interface HitStatistics {
  Great?: number
  Ok?: number
  Meh?: number
  Perfect?: number
  Good?: number
  Miss?: number
  [key: string]: number | undefined
}

// ── BeatmapInfo ──

export interface LazerBeatmap {
  ID: string
  DifficultyName: string
  Ruleset: string | BeatmapInfoRuleset
  Difficulty: string | BeatmapDifficulty
  Metadata: string | BeatmapMetadata
  Scores: string | LazerScore[]
  UserSettings: string | BeatmapUserSettings
  BeatmapSet: string | LazerBeatmapSet
  File: string | RealmNamedFileUsage
  Status: number
  StatusInt: number
  OnlineID: number
  Length: number
  BPM: number
  Hash: string
  StarRating: number
  MD5Hash: string
  OnlineMD5Hash: string
  LastLocalUpdate: string | null
  LastOnlineUpdate: string | null
  LastPlayed: string | null
  MatchesOnlineVersion: boolean
  Hidden: boolean
  EndTimeObjectCount: number
  TotalObjectCount: number
  BeatDivisor: number
  EditorTimestamp: number | null
  Path: string
}

// ── ScoreInfo ──

export interface LazerScore {
  ID: string
  BeatmapInfo: string | LazerBeatmap
  ClientVersion: string
  BeatmapHash: string
  Ruleset: string | BeatmapInfoRuleset
  Files: string | string[] | { File: string; Filename: string }[]
  Hash: string
  DeletePending: boolean
  TotalScore: number
  TotalScoreWithoutMods: number
  TotalScoreVersion: number
  LegacyTotalScore: number
  BackgroundReprocessingFailed: boolean
  MaxCombo: number
  Accuracy: number
  HasOnlineReplay: boolean
  Date: string
  Ranked: boolean
  OnlineID: number
  LegacyOnlineID: number
  RealmUser: string | RealmUserInfo
  ModsJson: string
  StatisticsJson: string
  MaximumStatisticsJson: string
  Pauses: string | string[]
  User: string | RealmUserInfo | RealmUserDetail
  Rank: number
  RankInt: number
  UserID: number
  RulesetID: number
  HitEvents: string | string[]
  Passed: boolean
  Perfect: boolean
  Combo: number
  DisplayAccuracy: Record<string, never>
  IsLegacyScore: boolean
  Statistics: string | HitStatistics
  MaximumStatistics: string | HitStatistics
  Mods: string | string[] | Record<string, never>[]
}
