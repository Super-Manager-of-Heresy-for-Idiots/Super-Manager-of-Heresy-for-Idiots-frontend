import api from './axios';
import type {
  ApiResponse,
  LevelUpOptionsResponse,
  LevelUpRequest,
  LevelUpResultResponse,
  CharacterRewardsResponse,
} from '@/types';

export const levelUpApi = {
  getOptions: async (characterId: string): Promise<ApiResponse<LevelUpOptionsResponse>> => {
    const response = await api.get<ApiResponse<LevelUpOptionsResponse>>(`/characters/${characterId}/level-up-options`);
    return response.data;
  },

  levelUp: async (characterId: string, data: LevelUpRequest): Promise<ApiResponse<LevelUpResultResponse>> => {
    const response = await api.post<ApiResponse<LevelUpResultResponse>>(`/characters/${characterId}/level-up`, data);
    return response.data;
  },

  getRewards: async (characterId: string): Promise<ApiResponse<CharacterRewardsResponse>> => {
    const response = await api.get<ApiResponse<CharacterRewardsResponse>>(`/characters/${characterId}/rewards`);
    return response.data;
  },
};
