export interface LazerSettings {
  clientRealmPath: string;
  isAvailable: boolean;
}

export interface StableSettings {
  osuRootPath: string;
  isAvailable: boolean;
}

export interface ApiV2Status {
  configured: boolean;
  tokenValid: boolean;
  clientId: string | null;
}

export interface ApiStatus {
  version: string;
  lazer: LazerSettings;
  stable: StableSettings;
  apiv2: ApiV2Status;
}

export interface CreateCollectionRequest {
  name: string;
  beatmapMd5Hashes: string[];
  overwrite?: boolean;
}

export interface WriteStarRatingsRequest {
  starRatings: Record<string, number>;
}

export interface WriteStableStarRatingsRequest {
  starRatings: Record<string, StarRating>;
}

export interface ListResponse<T> {
  count: number;
  items: T[];
}

export interface StarRatingResponse {
  starRating: number;
}

export interface UpdatedResponse {
  updated: number;
}


export interface APIMod {
  acronym: string;
  [key: string]: unknown;
}

export interface StarRating {
  NM: number;
  HT: number;
  DT: number;
}

export interface ManiaSRData {
  PPY: StarRating;
  XXY: StarRating;
}

export interface StableFileEntry {
  name: string;
  size: number;
  lastModified: string;
}

export interface StableFolderResponse {
  files: StableFileEntry[];
}

export interface CollectionOpResult {
  name: string;
  beatmapCount: number;
  created: boolean;
}

export interface ApiErrorDetail {
  error?: string;
  title?: string;
  status?: number;
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly detail: string,
  ) {
    super(`API Error (${status}): ${detail}`);
    this.name = 'ApiError';
  }
}
