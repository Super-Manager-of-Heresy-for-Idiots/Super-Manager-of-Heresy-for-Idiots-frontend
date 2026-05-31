import api from './axios';
import type { ApiResponse, GrantXpRequest } from '@/types';

export interface GrantXpResponse {
  charactersUpdated: number;
  xpGranted: number;
}

export const xpApi = {
  grant: async (campaignId: string, data: GrantXpRequest): Promise<ApiResponse<GrantXpResponse>> => {
    const response = await api.post<ApiResponse<GrantXpResponse>>(`/campaigns/${campaignId}/xp`, data);
    return response.data;
  },
};
