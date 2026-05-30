import api from './axios';
import type { ApiResponse, GrantXpRequest } from '@/types';

export const xpApi = {
  grant: async (campaignId: string, data: GrantXpRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${campaignId}/xp`, data);
    return response.data;
  },
};
