import api from './axios';
import type {
  ApiResponse,
  ArtifactResponse,
  CreateArtifactRequest,
} from '@/types';

export const artifactsApi = {
  list: async (): Promise<ApiResponse<ArtifactResponse[]>> => {
    const response = await api.get<ApiResponse<ArtifactResponse[]>>('/artifacts');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ArtifactResponse>> => {
    const response = await api.get<ApiResponse<ArtifactResponse>>(`/artifacts/${id}`);
    return response.data;
  },

  create: async (data: CreateArtifactRequest): Promise<ApiResponse<ArtifactResponse>> => {
    const response = await api.post<ApiResponse<ArtifactResponse>>('/artifacts', data);
    return response.data;
  },

  update: async (id: string, data: CreateArtifactRequest): Promise<ApiResponse<ArtifactResponse>> => {
    const response = await api.put<ApiResponse<ArtifactResponse>>(`/artifacts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/artifacts/${id}`);
    return response.data;
  },
};
