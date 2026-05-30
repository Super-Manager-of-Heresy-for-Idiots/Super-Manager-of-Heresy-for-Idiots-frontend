import api from './axios';
import type { ApiResponse, ActiveEffect, ApplyEffectRequest } from '@/types';

export const effectsApi = {
  list: async (characterId: string): Promise<ApiResponse<ActiveEffect[]>> => {
    const response = await api.get<ApiResponse<ActiveEffect[]>>(`/characters/${characterId}/effects`);
    return response.data;
  },

  apply: async (characterId: string, data: ApplyEffectRequest): Promise<ApiResponse<ActiveEffect>> => {
    const response = await api.post<ApiResponse<ActiveEffect>>(`/characters/${characterId}/effects`, data);
    return response.data;
  },

  remove: async (characterId: string, effectId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/characters/${characterId}/effects/${effectId}`);
    return response.data;
  },

  advanceRound: async (characterId: string): Promise<ApiResponse<ActiveEffect[]>> => {
    const response = await api.post<ApiResponse<ActiveEffect[]>>(`/characters/${characterId}/effects/advance-round`);
    return response.data;
  },
};
