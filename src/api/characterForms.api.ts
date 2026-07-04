import api from './axios';
import type { ApiResponse } from '@/types';

/**
 * Wild Shape forms, transformations and companions for a character (feature-rules runtime, Stage 10).
 * Backend: /api/characters/{characterId}/features/{forms,transformation,companions}. Returns empty unless
 * the runtime is enabled (app.feature-rules.forms) and rules are approved. Access owner/GM/ADMIN.
 */

export interface KnownForm {
  id: string;
  monsterId: string;
  sourceFeatureId?: string | null;
  learnedAtLevel?: number | null;
  approvedByDm: boolean;
}

export interface Transformation {
  id: string;
  monsterId: string;
  sourceFeatureId?: string | null;
  activeEffectId?: string | null;
  status: string;
  startedAt?: string | null;
  expiresAt?: string | null;
}

export interface Companion {
  id: string;
  monsterId?: string | null;
  customName?: string | null;
  state?: string | null;
  hp?: number | null;
  ac?: number | null;
  attackBonus?: number | null;
}

const base = (characterId: string) => `/characters/${characterId}/features`;

export const characterFormsApi = {
  listForms: async (characterId: string): Promise<ApiResponse<KnownForm[]>> =>
    (await api.get<ApiResponse<KnownForm[]>>(`${base(characterId)}/forms`)).data,

  learnForm: async (
    characterId: string,
    monsterId: string,
    sourceFeatureId?: string,
  ): Promise<ApiResponse<KnownForm>> =>
    (await api.post<ApiResponse<KnownForm>>(`${base(characterId)}/forms`, null, {
      params: { monsterId, sourceFeatureId },
    })).data,

  approveForm: async (characterId: string, formId: string): Promise<ApiResponse<KnownForm>> =>
    (await api.post<ApiResponse<KnownForm>>(`${base(characterId)}/forms/${formId}/approve`)).data,

  getTransformation: async (characterId: string): Promise<ApiResponse<Transformation | null>> =>
    (await api.get<ApiResponse<Transformation | null>>(`${base(characterId)}/transformation`)).data,

  transform: async (
    characterId: string,
    monsterId: string,
    sourceFeatureId?: string,
  ): Promise<ApiResponse<Transformation>> =>
    (await api.post<ApiResponse<Transformation>>(`${base(characterId)}/transformation`, null, {
      params: { monsterId, sourceFeatureId },
    })).data,

  endTransformation: async (characterId: string): Promise<ApiResponse<void>> =>
    (await api.post<ApiResponse<void>>(`${base(characterId)}/transformation/end`)).data,

  listCompanions: async (characterId: string): Promise<ApiResponse<Companion[]>> =>
    (await api.get<ApiResponse<Companion[]>>(`${base(characterId)}/companions`)).data,

  createCompanion: async (
    characterId: string,
    monsterId?: string,
    sourceFeatureId?: string,
    name?: string,
  ): Promise<ApiResponse<Companion>> =>
    (await api.post<ApiResponse<Companion>>(`${base(characterId)}/companions`, null, {
      params: { monsterId, sourceFeatureId, name },
    })).data,

  dismissCompanion: async (characterId: string, companionId: string): Promise<ApiResponse<void>> =>
    (await api.post<ApiResponse<void>>(`${base(characterId)}/companions/${companionId}/dismiss`)).data,
};
