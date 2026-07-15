import api from './axios';
import type { ApiResponse, HomebrewSpellRequest, HomebrewSpellResponse } from '@/types';

/**
 * Авторинг homebrew-заклинания (P2-1). Пути package-scoped:
 * /api/homebrew/packages/{packageId}/spells[/{spellId}]. Механика — через движок feature-rules отдельно.
 */
export const homebrewSpellsApi = {
  get: async (packageId: string, spellId: string): Promise<ApiResponse<HomebrewSpellResponse>> => {
    const response = await api.get<ApiResponse<HomebrewSpellResponse>>(`/homebrew/packages/${packageId}/spells/${spellId}`);
    return response.data;
  },
  create: async (packageId: string, data: HomebrewSpellRequest): Promise<ApiResponse<HomebrewSpellResponse>> => {
    const response = await api.post<ApiResponse<HomebrewSpellResponse>>(`/homebrew/packages/${packageId}/spells`, data);
    return response.data;
  },
  update: async (packageId: string, spellId: string, data: HomebrewSpellRequest): Promise<ApiResponse<HomebrewSpellResponse>> => {
    const response = await api.put<ApiResponse<HomebrewSpellResponse>>(`/homebrew/packages/${packageId}/spells/${spellId}`, data);
    return response.data;
  },
  remove: async (packageId: string, spellId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/packages/${packageId}/spells/${spellId}`);
    return response.data;
  },
};
