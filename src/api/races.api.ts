import api from './axios';
import type { ApiResponse, RaceRequest, RaceResponse } from '@/types';

export const racesApi = {
  // === GM HOMEBREW — авторинг видов в DRAFT-пакете (SP-1..SP-3) ===
  // Пути package-scoped, по образцу авторинга классов. Легаси /homebrew/my/{id}/content/races удалён (S5).
  homebrewCreate: async (packageId: string, data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/packages/${packageId}/species`,
      data,
    );
    return response.data;
  },
  homebrewUpdate: async (packageId: string, raceId: string, data: RaceRequest): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.put<ApiResponse<RaceResponse>>(
      `/homebrew/packages/${packageId}/species/${raceId}`,
      data,
    );
    return response.data;
  },
  homebrewEnable: async (packageId: string, raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/packages/${packageId}/species/${raceId}/enable`,
    );
    return response.data;
  },
  homebrewDisable: async (packageId: string, raceId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/packages/${packageId}/species/${raceId}/disable`,
    );
    return response.data;
  },
  // SP-2: глубокий клон vanilla-вида в пакет («раса на базе эльфа»).
  homebrewDuplicate: async (packageId: string, vanillaSpeciesId: string): Promise<ApiResponse<RaceResponse>> => {
    const response = await api.post<ApiResponse<RaceResponse>>(
      `/homebrew/packages/${packageId}/species/duplicate-from/${vanillaSpeciesId}`,
    );
    return response.data;
  },
};
