import api from './axios';
import type { ApiResponse, TeamResponse, JoinTeamRequest } from '@/types';

export const teamsApi = {
  list: async (): Promise<ApiResponse<TeamResponse[]>> => {
    const response = await api.get<ApiResponse<TeamResponse[]>>('/teams');
    return response.data;
  },

  join: async (data: JoinTeamRequest): Promise<ApiResponse<TeamResponse>> => {
    const response = await api.post<ApiResponse<TeamResponse>>('/teams/join', data);
    return response.data;
  },
};
