import api from '@/api/axios';
import type { ApiResponse, LoginPageStatsResponse, AppReleaseConfig } from '@/types';

export const loginPageApi = {
  getStats: async (): Promise<ApiResponse<LoginPageStatsResponse>> => {
    const response = await api.get<ApiResponse<LoginPageStatsResponse>>('/public/login-stats');
    return response.data;
  },

  getReleaseConfig: async (): Promise<AppReleaseConfig> => {
    const response = await fetch('/app-release.json', { cache: 'no-cache' });
    if (!response.ok) {
      throw new Error(`Failed to load app release config: ${response.status}`);
    }
    return response.json() as Promise<AppReleaseConfig>;
  },
};
