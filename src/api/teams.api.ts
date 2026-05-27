import api from './axios';
import type { ApiResponse, Team, CreateTeamDto, JoinTeamDto } from '@/types';

export const teamsApi = {
  list: async (): Promise<ApiResponse<Team[]>> => {
    const response = await api.get<ApiResponse<Team[]>>('/teams');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Team>> => {
    const response = await api.get<ApiResponse<Team>>(`/teams/${id}`);
    return response.data;
  },

  create: async (data: CreateTeamDto): Promise<ApiResponse<Team>> => {
    const response = await api.post<ApiResponse<Team>>('/teams', data);
    return response.data;
  },

  update: async (id: string, data: CreateTeamDto): Promise<ApiResponse<Team>> => {
    const response = await api.put<ApiResponse<Team>>(`/teams/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/teams/${id}`);
    return response.data;
  },

  regenerateInvite: async (id: string): Promise<ApiResponse<{ inviteCode: string }>> => {
    const response = await api.post<ApiResponse<{ inviteCode: string }>>(`/teams/${id}/regenerate-invite`);
    return response.data;
  },

  getInviteCode: async (id: string): Promise<ApiResponse<{ inviteCode: string }>> => {
    const response = await api.get<ApiResponse<{ inviteCode: string }>>(`/teams/${id}/invite-code`);
    return response.data;
  },

  join: async (data: JoinTeamDto): Promise<ApiResponse<Team>> => {
    const response = await api.post<ApiResponse<Team>>('/teams/join', data);
    return response.data;
  },
};
