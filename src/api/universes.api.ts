import api from './axios';
import type {
  ApiResponse,
  UniverseResponse,
  CreateUniverseRequest,
} from '@/types';

export const universesApi = {
  list: async (): Promise<ApiResponse<UniverseResponse[]>> => {
    const response = await api.get<ApiResponse<UniverseResponse[]>>('/universes');
    return response.data;
  },

  create: async (data: CreateUniverseRequest): Promise<ApiResponse<UniverseResponse>> => {
    const response = await api.post<ApiResponse<UniverseResponse>>('/universes', data);
    return response.data;
  },
};
