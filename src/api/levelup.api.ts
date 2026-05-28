import api from './axios';
import type {
  ApiResponse,
  LevelUpPreview,
  LevelUpRequest,
  AcquiredReward,
  CharacterDetailed,
} from '@/types';

export const levelUpApi = {
  getCharacterDetailed: async (id: string): Promise<ApiResponse<CharacterDetailed>> => {
    const response = await api.get<ApiResponse<CharacterDetailed>>(`/characters/${id}/detailed`);
    return response.data;
  },

  getLevelUpPreview: async (characterId: string): Promise<ApiResponse<LevelUpPreview>> => {
    const response = await api.get<ApiResponse<LevelUpPreview>>(`/characters/${characterId}/level-up/preview`);
    return response.data;
  },

  commitLevelUp: async (characterId: string, data: LevelUpRequest): Promise<ApiResponse<CharacterDetailed>> => {
    const response = await api.post<ApiResponse<CharacterDetailed>>(`/characters/${characterId}/level-up`, data);
    return response.data;
  },

  getAcquiredRewards: async (characterId: string): Promise<ApiResponse<AcquiredReward[]>> => {
    const response = await api.get<ApiResponse<AcquiredReward[]>>(`/characters/${characterId}/rewards`);
    return response.data;
  },
};
