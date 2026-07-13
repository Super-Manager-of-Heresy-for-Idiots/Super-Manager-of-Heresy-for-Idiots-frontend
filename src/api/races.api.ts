import api from './axios';
import type { ApiResponse, RaceRequest, RaceResponse } from '@/types';

export const racesApi = {
  // === ADMIN — SYSTEM races ===
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
  // NB: авторинг видов ждёт backend — см. docs/HB_PLAN.md (блок P0.5, задачи SP-1…SP-4;
  // пути переедут на /api/homebrew/packages/{packageId}/species*). Мёртвые методы (duplicate,
  // campaignList/campaignGet — легаси /campaigns/{id}/races, нет backend) удалены при аудите эндпоинтов.
};
