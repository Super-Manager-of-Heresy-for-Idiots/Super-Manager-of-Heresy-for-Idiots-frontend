import api from './axios';
import type {
  ApiResponse,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
} from '@/types';

export const locationsApi = {
  list: async (campaignId: string): Promise<ApiResponse<LocationResponse[]>> => {
    const response = await api.get<ApiResponse<LocationResponse[]>>(`/campaigns/${campaignId}/locations`);
    return response.data;
  },

  getById: async (campaignId: string, locationId: string): Promise<ApiResponse<LocationResponse>> => {
    const response = await api.get<ApiResponse<LocationResponse>>(`/campaigns/${campaignId}/locations/${locationId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateLocationRequest): Promise<ApiResponse<LocationResponse>> => {
    const response = await api.post<ApiResponse<LocationResponse>>(`/campaigns/${campaignId}/locations`, data);
    return response.data;
  },

  update: async (campaignId: string, locationId: string, data: UpdateLocationRequest): Promise<ApiResponse<LocationResponse>> => {
    const response = await api.put<ApiResponse<LocationResponse>>(`/campaigns/${campaignId}/locations/${locationId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, locationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/locations/${locationId}`);
    return response.data;
  },
};
