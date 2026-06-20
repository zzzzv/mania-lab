import type {
  ApiStatus,
  CreateCollectionRequest,
  CollectionOpResult,
  WriteStarRatingsRequest,
  WriteStableStarRatingsRequest,
  ListResponse,
  StarRatingResponse,
  UpdatedResponse,
  APIMod,
  StableFolderResponse,
} from './types';
import type { LazerBeatmap, LazerBeatmapSet, LazerCollection, LazerScore } from './lazer-types';
import { ApiError } from './types';
import ky from 'ky';

const apiClient = ky.extend({
  prefix: '/api',
  retry: 0,
  timeout: false,
  hooks: {
    afterResponse: [
      async ({ response }) => {
        if (!response.ok) {
          let detail = response.statusText;
          try {
            const json = await response.clone().json();
            detail = json.error ?? json.title ?? detail;
          } catch {
            // ignore
          }
          throw new ApiError(response.status, detail);
        }
      },
    ],
  },
});

const get = <T>(url: string) => apiClient.get(url).json<T>();
const postJson = <T>(url: string, body: unknown) => apiClient.post(url, { json: body }).json<T>();
const postPlain = <T>(url: string, body: string) => apiClient.post(url, { body, headers: { 'Content-Type': 'text/plain' } }).json<T>();

type QsValue = string | number | string[] | undefined | null

const qs = (params: Record<string, QsValue>) => {
  const usp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v == null) continue
    if (Array.isArray(v)) {
      for (const item of v) usp.append(k, item)
    } else {
      usp.set(k, String(v))
    }
  }
  return usp.toString();
};

export const api = {
  getStatus: () => get<ApiStatus>('/status'),

  getLazerBeatmaps: (rql: string, depth?: number, noExpand?: string[]) =>
    get<ListResponse<LazerBeatmap>>(`/lazer/beatmaps?${qs({ rql, depth, noExpand })}`),

  getLazerBeatmapSets: (rql: string, depth?: number, noExpand?: string[]) =>
    get<ListResponse<LazerBeatmapSet>>(`/lazer/beatmapsets?${qs({ rql, depth, noExpand })}`),

  getLazerCollections: (rql: string, depth?: number, noExpand?: string[]) =>
    get<ListResponse<LazerCollection>>(`/lazer/collections?${qs({ rql, depth, noExpand })}`),

  updateLazerCollection: (req: CreateCollectionRequest) =>
    postJson<CollectionOpResult>('/lazer/collection/update', req),

  getLazerFileUrl: (hash: string) => `/api/lazer/files/${encodeURIComponent(hash)}`,

  getLazerScores: (rql: string, depth?: number, noExpand?: string[]) =>
    get<ListResponse<LazerScore>>(`/lazer/scores?${qs({ rql, depth, noExpand })}`),

  calculateLazerStarRating: (beatmapContent: string, mods?: string | APIMod[]) => {
    const modsStr = typeof mods === 'string' ? mods : mods ? JSON.stringify(mods) : undefined;
    const path = modsStr
      ? `/lazer/star-rating/calculate?mods=${encodeURIComponent(modsStr)}`
      : '/lazer/star-rating/calculate';
    return postPlain<StarRatingResponse>(path, beatmapContent);
  },

  updateLazerStarRatings: (req: WriteStarRatingsRequest) =>
    postJson<UpdatedResponse>('/lazer/star-rating/update', req),

  fetchManiaSRPack: () => apiClient.get('/management/mania-sr/msgpack').arrayBuffer(),

  updateStableCollection: (req: CreateCollectionRequest) =>
    postJson<CollectionOpResult>('/stable/collection/update', req),

  listStableFolder: (folderPath: string) =>
    get<StableFolderResponse>(`/stable/folder/${folderPath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`),

  fetchStableFile: (relativePath: string) =>
    apiClient.get(`stable/files/${relativePath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`).arrayBuffer(),

  getStableFileUrl: (relativePath: string) =>
    `/api/stable/files/${relativePath.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`,

  updateStableStarRatings: (req: WriteStableStarRatingsRequest) =>
    postJson<UpdatedResponse>('/stable/star-rating/update', req),

  calculateXxyStarRating: (beatmapContent: string, speedRate: number) =>
    postPlain<StarRatingResponse>(`/tools/xxy-calculate?speedRate=${speedRate}`, beatmapContent),
};
