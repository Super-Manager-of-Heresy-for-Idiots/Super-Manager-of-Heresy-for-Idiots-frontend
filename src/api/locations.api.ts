import api from './axios';
import type {
  ApiResponse,
  LocationResponse,
  CreateLocationRequest,
  UpdateLocationRequest,
  LocationOccupantsResponse,
  LocationRef,
  LocationMapResponse,
  AttachLocationMapRequest,
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

  toggleVisibility: async (campaignId: string, locationId: string): Promise<ApiResponse<LocationResponse>> => {
    const response = await api.post<ApiResponse<LocationResponse>>(`/campaigns/${campaignId}/locations/${locationId}/toggle-visibility`);
    return response.data;
  },

  // WORLD_PLAN Этап 1: присутствие в мире.
  occupants: async (campaignId: string, locationId: string): Promise<ApiResponse<LocationOccupantsResponse>> => {
    const response = await api.get<ApiResponse<LocationOccupantsResponse>>(`/campaigns/${campaignId}/locations/${locationId}/occupants`);
    return response.data;
  },

  enter: async (campaignId: string, locationId: string, characterId: string): Promise<ApiResponse<LocationRef>> => {
    const response = await api.post<ApiResponse<LocationRef>>(`/campaigns/${campaignId}/locations/${locationId}/enter`, { characterId });
    return response.data;
  },

  leave: async (campaignId: string, locationId: string, characterId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${campaignId}/locations/${locationId}/leave`, { characterId });
    return response.data;
  },

  // WORLD_PLAN Этап 4: карты локации.
  listMaps: async (campaignId: string, locationId: string): Promise<ApiResponse<LocationMapResponse[]>> => {
    const response = await api.get<ApiResponse<LocationMapResponse[]>>(`/campaigns/${campaignId}/locations/${locationId}/maps`);
    return response.data;
  },

  attachMap: async (campaignId: string, locationId: string, data: AttachLocationMapRequest): Promise<ApiResponse<LocationMapResponse>> => {
    const response = await api.post<ApiResponse<LocationMapResponse>>(`/campaigns/${campaignId}/locations/${locationId}/maps`, data);
    return response.data;
  },

  detachMap: async (campaignId: string, locationId: string, linkId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/locations/${locationId}/maps/${linkId}`);
    return response.data;
  },
};
