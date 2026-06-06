import api from './axios';
import type { ApiResponse, RaceRequest, RaceResponse } from '@/types';

export const racesApi = {
  // === ADMIN — SYSTEM races ===
  adminList: async (): Promise<ApiResponse<RaceResponse[]>> => {
    const response = await api.get<ApiResponse<RaceResponse[]>>('/admin/races');
    return response.data;
  },
  adminGet: async (raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.get<ApiResponse<RaceResponse>>(`/admin/races/${raceId}`);
    return response.data;
  },
  adminCreate: async (data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>('/admin/races', data);
    return response.data;
  },
  adminUpdate: async (raceId: string, data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.put<ApiResponse<RaceResponse>>(`/admin/races/${raceId}`, data);
    return response.data;
  },
  adminEnable: async (raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(`/admin/races/${raceId}/enable`);
    return response.data;
  },
  adminDisable: async (raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(`/admin/races/${raceId}/disable`);
    return response.data;
  },

  // === GM HOMEBREW — DRAFT package races ===
  homebrewCreate: async (packageId: string, data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/my/${packageId}/content/races`,
      data,
    );
    return response.data;
  },
  homebrewUpdate: async (packageId: string, raceId: string, data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.put<ApiResponse<RaceResponse>>(
      `/homebrew/my/${packageId}/content/races/${raceId}`,
      data,
    );
    return response.data;
  },
  homebrewEnable: async (packageId: string, raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/my/${packageId}/content/races/${raceId}/enable`,
    );
    return response.data;
  },
  homebrewDisable: async (packageId: string, raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/my/${packageId}/content/races/${raceId}/disable`,
    );
    return response.data;
  },
  homebrewDuplicate: async (packageId: string, systemRaceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/my/${packageId}/content/races/${systemRaceId}/duplicate`,
    );
    return response.data;
  },

  // === PLAYER / CAMPAIGN ===
  campaignList: async (campaignId: string): Promise<ApiResponse<RaceResponse[]>> => {
    const response = await api.get<ApiResponse<RaceResponse[]>>(`/campaigns/${campaignId}/races`);
    return response.data;
  },
  campaignGet: async (campaignId: string, raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.get<ApiResponse<RaceResponse>>(
      `/campaigns/${campaignId}/races/${raceId}`,
    );
    return response.data;
  },
};
