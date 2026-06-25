import mapHttp from './mapHttp';
import { mapAssetContentUrl } from './mapApiConfig';
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

  /** Server-relative URL to the asset's binary content (see {@link mapAssetContentUrl}). */
  contentUrl: (assetId: UUID): string => mapAssetContentUrl(assetId),

  /** GET /api/map-assets/{assetId}/content — authorized binary image content. */
  content: async (assetId: UUID): Promise<Blob> => {
    const { data } = await mapHttp.get<Blob>(`/map-assets/${assetId}/content`, {
      responseType: 'blob',
    });
    return data;
  },

  /** POST /api/map-assets/{assetId}/download-url — temporary direct download URL. */
  createDownloadUrl: async (assetId: UUID): Promise<AssetDownloadUrlDto> => {
    const { data } = await mapHttp.post<AssetDownloadUrlDto>(`/map-assets/${assetId}/download-url`);
    return data;
  },
};
