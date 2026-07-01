import mapHttp from './mapHttp';
import { browserSafeAssetUrl, mapAssetContentUrl } from './mapApiConfig';
import type { AssetDownloadUrlDto, MapAssetDto, UUID } from '../types';

/** Map-service asset endpoints (`/api/map-assets`). */
export const mapAssetApi = {
  /** POST /api/map-assets — multipart upload of a background image. */
  upload: async (campaignId: UUID, file: File): Promise<MapAssetDto> => {
    const form = new FormData();
    form.append('campaignId', campaignId);
    form.append('file', file);
    const { data } = await mapHttp.post<MapAssetDto>('/map-assets', form);
    return data;
  },

  /** GET /api/map-assets/{assetId} — asset metadata. */
  get: async (assetId: UUID): Promise<MapAssetDto> => {
    const { data } = await mapHttp.get<MapAssetDto>(`/map-assets/${assetId}`);
    return data;
  },

  /** Browser-safe, same-origin URL to the asset's binary content. */
  contentUrl: (assetId: UUID): string => mapAssetContentUrl(assetId),

  /**
   * Browser-safe URL for rendering an asset's image: the same-origin content endpoint,
   * never an internal MinIO/presigned URL (audit MAP-13). See {@link browserSafeAssetUrl}.
   */
  browserSafeUrl: (asset: MapAssetDto): string => browserSafeAssetUrl(asset),

  /** GET /api/map-assets/{assetId}/content — authorized binary image content. */
  content: async (assetId: UUID): Promise<Blob> => {
    const { data } = await mapHttp.get<Blob>(`/map-assets/${assetId}/content`, {
      responseType: 'blob',
    });
    return data;
  },

  /**
   * POST /api/map-assets/{assetId}/download-url — a temporary presigned object-store
   * URL. WARNING: this may be an INTERNAL MinIO endpoint (e.g. `http://map-minio:9000`)
   * that the browser cannot resolve (audit MAP-13). Do NOT use it for `<img>`/rendering
   * or direct browser download — use {@link mapAssetApi.content} /
   * {@link mapAssetApi.browserSafeUrl} instead. This stays only for server-to-server or
   * explicitly public/CDN URLs the backend guarantees are reachable.
   */
  createDownloadUrl: async (assetId: UUID): Promise<AssetDownloadUrlDto> => {
    const { data } = await mapHttp.post<AssetDownloadUrlDto>(`/map-assets/${assetId}/download-url`);
    return data;
  },
};
