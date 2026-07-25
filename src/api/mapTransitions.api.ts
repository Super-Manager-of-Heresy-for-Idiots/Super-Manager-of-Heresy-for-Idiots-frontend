import api from './axios';
import type {
  ApiResponse,
  MapTransitionResponse,
  CreateMapTransitionRequest,
  UpdateMapTransitionRequest,
  TraverseTransitionRequest,
  TraverseResultResponse,
} from '@/types';

/**
 * API переходов между картами через ключевые клетки (WORLD_PLAN Этап 5).
 * Живёт в core (не map-service): core — источник истины по миру.
 */
export const mapTransitionsApi = {
  list: async (campaignId: string, mapId?: string): Promise<ApiResponse<MapTransitionResponse[]>> => {
    const response = await api.get<ApiResponse<MapTransitionResponse[]>>(
      `/campaigns/${campaignId}/map-transitions`,
      { params: mapId ? { mapId } : undefined },
    );
    return response.data;
  },

  create: async (campaignId: string, data: CreateMapTransitionRequest): Promise<ApiResponse<MapTransitionResponse>> => {
    const response = await api.post<ApiResponse<MapTransitionResponse>>(`/campaigns/${campaignId}/map-transitions`, data);
    return response.data;
  },

  update: async (campaignId: string, transitionId: string, data: UpdateMapTransitionRequest): Promise<ApiResponse<MapTransitionResponse>> => {
    const response = await api.put<ApiResponse<MapTransitionResponse>>(`/campaigns/${campaignId}/map-transitions/${transitionId}`, data);
    return response.data;
  },

  remove: async (campaignId: string, transitionId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/map-transitions/${transitionId}`);
    return response.data;
  },

  traverse: async (campaignId: string, transitionId: string, data: TraverseTransitionRequest): Promise<ApiResponse<TraverseResultResponse>> => {
    const response = await api.post<ApiResponse<TraverseResultResponse>>(
      `/campaigns/${campaignId}/map-transitions/${transitionId}/traverse`,
      data,
    );
    return response.data;
  },
};
