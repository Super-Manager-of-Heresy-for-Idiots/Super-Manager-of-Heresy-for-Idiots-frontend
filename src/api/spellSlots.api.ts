import api from './axios';
import type { ApiResponse, SpellSlotsResponse } from '@/types';

/**
 * Per-character spell slot tracking. Maxima are derived server-side from class
 * progression (never stored); only expenditure is persisted. Spend one slot, or
 * restore all / half of the expended slots (long rest / partial recovery).
 */
export const spellSlotsApi = {
  get: async (characterId: string): Promise<ApiResponse<SpellSlotsResponse>> => {
    const response = await api.get<ApiResponse<SpellSlotsResponse>>(
      `/characters/${characterId}/spell-slots`,
    );
    return response.data;
  },

  expend: async (characterId: string, spellLevel: number): Promise<ApiResponse<SpellSlotsResponse>> => {
    const response = await api.post<ApiResponse<SpellSlotsResponse>>(
      `/characters/${characterId}/spell-slots/${spellLevel}/expend`,
    );
    return response.data;
  },

  restoreOne: async (characterId: string, spellLevel: number): Promise<ApiResponse<SpellSlotsResponse>> => {
    const response = await api.post<ApiResponse<SpellSlotsResponse>>(
      `/characters/${characterId}/spell-slots/${spellLevel}/restore`,
    );
    return response.data;
  },

  restoreAll: async (characterId: string): Promise<ApiResponse<SpellSlotsResponse>> => {
    const response = await api.post<ApiResponse<SpellSlotsResponse>>(
      `/characters/${characterId}/spell-slots/restore-all`,
    );
    return response.data;
  },

  restoreHalf: async (characterId: string): Promise<ApiResponse<SpellSlotsResponse>> => {
    const response = await api.post<ApiResponse<SpellSlotsResponse>>(
      `/characters/${characterId}/spell-slots/restore-half`,
    );
    return response.data;
  },
};
