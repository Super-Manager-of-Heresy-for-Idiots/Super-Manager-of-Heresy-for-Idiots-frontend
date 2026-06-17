import api from './axios';
import type {
  ApiResponse,
  ClassSaveResult,
  ClassWriteRequest,
  ContentClassDetailResponse,
} from '@/types';

/** Authoring scope: core/admin (homebrew_id = NULL) or a homebrew package. */
export type AuthoringScope = { kind: 'admin' } | { kind: 'homebrew'; packageId: string };

function basePath(scope: AuthoringScope): string {
  return scope.kind === 'admin'
    ? '/admin/character-classes'
    : `/homebrew/packages/${scope.packageId}/classes`;
}

/**
 * Aggregate class authoring (new content model). One request describes the whole
 * class graph (mechanics + features + subclasses + reward groups/options/grants);
 * the server diffs children by id (update) / key (create) / absence (delete).
 */
/** Class detail + its concurrency etag (from ClassSaveResult / GET ETag header). */
export interface ClassWithEtag {
  class?: ContentClassDetailResponse;
  etag?: string;
}

export const classAuthoringApi = {
  get: async (scope: AuthoringScope, id: string): Promise<ApiResponse<ContentClassDetailResponse>> => {
    const response = await api.get<ApiResponse<ContentClassDetailResponse>>(`${basePath(scope)}/${id}`);
    return response.data;
  },

  /** GET that also surfaces the ETag header for a subsequent If-Match update. */
  getForEdit: async (scope: AuthoringScope, id: string): Promise<ClassWithEtag> => {
    const response = await api.get<ApiResponse<ContentClassDetailResponse>>(`${basePath(scope)}/${id}`);
    const headerEtag = response.headers?.etag ?? response.headers?.ETag;
    return { class: response.data.data, etag: typeof headerEtag === 'string' ? headerEtag : undefined };
  },

  create: async (
    scope: AuthoringScope,
    data: ClassWriteRequest,
    idempotencyKey?: string,
  ): Promise<ApiResponse<ClassSaveResult>> => {
    const response = await api.post<ApiResponse<ClassSaveResult>>(
      basePath(scope),
      data,
      idempotencyKey ? { headers: { 'Idempotency-Key': idempotencyKey } } : undefined,
    );
    return response.data;
  },

  update: async (
    scope: AuthoringScope,
    id: string,
    data: ClassWriteRequest,
    etag?: string,
  ): Promise<ApiResponse<ClassSaveResult>> => {
    const response = await api.put<ApiResponse<ClassSaveResult>>(
      `${basePath(scope)}/${id}`,
      data,
      etag ? { headers: { 'If-Match': etag } } : undefined,
    );
    return response.data;
  },

  remove: async (scope: AuthoringScope, id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${basePath(scope)}/${id}`);
    return response.data;
  },
};
