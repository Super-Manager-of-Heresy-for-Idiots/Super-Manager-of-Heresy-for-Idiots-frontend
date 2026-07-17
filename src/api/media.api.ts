import api from './axios';
import type { ApiResponse } from '@/types';

/**
 * Owner types for a media asset — MUST mirror the backend `MediaOwnerType` enum.
 * The pair (ownerType, ownerId) addresses exactly one image slot.
 */
export type MediaOwnerType =
  | 'CHARACTER_AVATAR'
  | 'NPC_PORTRAIT'
  | 'HOMEBREW_COVER'
  | 'BLUEPRINT_COVER';

/** Response after uploading an image (mirrors the backend `MediaAssetResponse`). */
export interface MediaAssetResponse {
  assetId: string;
  /** Relative proxy path that streams the bytes: `/api/media/{assetId}/content`. Use directly in <img src>. */
  url: string;
  contentType: string;
  sizeBytes: number;
  widthPx?: number | null;
  heightPx?: number | null;
}

/**
 * Media module client (avatars, portraits, covers). One image slot per (ownerType, ownerId):
 * re-uploading replaces the previous image, and the returned `url` changes so caches never go stale.
 */
export const mediaApi = {
  /** Upload (or replace) the image in an owner's slot. */
  upload: async (
    ownerType: MediaOwnerType,
    ownerId: string,
    file: File,
  ): Promise<ApiResponse<MediaAssetResponse>> => {
    const form = new FormData();
    form.append('file', file);
    // Override the default JSON content-type: passing FormData lets axios compute the
    // multipart boundary itself. Auth cookie + CSRF header are handled by the shared instance.
    const response = await api.post<ApiResponse<MediaAssetResponse>>(
      `/media/${ownerType}/${ownerId}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    return response.data;
  },

  /** Remove the image in an owner's slot. */
  remove: async (
    ownerType: MediaOwnerType,
    ownerId: string,
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/media/${ownerType}/${ownerId}`);
    return response.data;
  },
};
