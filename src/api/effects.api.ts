import api from './axios';
import type { ApiResponse, CharacterActiveEffectResponse, ApplyEffectRequest } from '@/types';

export const effectsApi = {
  list: async (campaignId: string, characterId: string): Promise<ApiResponse<CharacterActiveEffectResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterActiveEffectResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/effects`);
    return response.data;
  },

  apply: async (campaignId: string, characterId: string, data: ApplyEffectRequest): Promise<ApiResponse<CharacterActiveEffectResponse>> => {
    const response = await api.post<ApiResponse<CharacterActiveEffectResponse>>(`/campaigns/${campaignId}/characters/${characterId}/effects`, data);
    return response.data;
  },

  remove: async (campaignId: string, characterId: string, effectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/characters/${characterId}/effects/${effectId}`);
    return response.data;
  },
};
