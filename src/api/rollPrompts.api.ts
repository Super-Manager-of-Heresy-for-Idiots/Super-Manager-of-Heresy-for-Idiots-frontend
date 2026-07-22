import api from './axios';
import type {
  ApiResponse,
  RollPromptResponse,
  RollPromptStatus,
  CreateRollPromptRequest,
} from '@/types';

/**
 * API запрошенных мастером проверок (ROLL_PROMPT): мастер создаёт/отменяет запросы,
 * игрок видит свои и бросает (d20 исполняется на сервере).
 */
export const rollPromptsApi = {
  list: async (campaignId: string, status?: RollPromptStatus): Promise<ApiResponse<RollPromptResponse[]>> => {
    const response = await api.get<ApiResponse<RollPromptResponse[]>>(
      `/campaigns/${campaignId}/roll-prompts`,
      { params: status ? { status } : undefined },
    );
    return response.data;
  },

  create: async (campaignId: string, data: CreateRollPromptRequest): Promise<ApiResponse<RollPromptResponse[]>> => {
    const response = await api.post<ApiResponse<RollPromptResponse[]>>(`/campaigns/${campaignId}/roll-prompts`, data);
    return response.data;
  },

  roll: async (campaignId: string, promptId: string): Promise<ApiResponse<RollPromptResponse>> => {
    const response = await api.post<ApiResponse<RollPromptResponse>>(`/campaigns/${campaignId}/roll-prompts/${promptId}/roll`);
    return response.data;
  },

  cancel: async (campaignId: string, promptId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${campaignId}/roll-prompts/${promptId}/cancel`);
    return response.data;
  },
};
