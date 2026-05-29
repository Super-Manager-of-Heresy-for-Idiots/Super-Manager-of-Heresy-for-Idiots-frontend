import api from './axios';
import type { ApiResponse, TeamResponse, CreateTeamRequest, JoinTeamRequest, InviteCodeResponse } from '@/types';

export const teamsApi = {
  list: async (): Promise<ApiResponse<TeamResponse[]>> => {
    const response = await api.get<ApiResponse<TeamResponse[]>>('/teams');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<TeamResponse>> => {
    const response = await api.get<ApiResponse<TeamResponse>>(`/teams/${id}`);
    return response.data;
  },

  create: async (data: CreateTeamRequest): Promise<ApiResponse<TeamResponse>> => {
    const response = await api.post<ApiResponse<TeamResponse>>('/teams', data);
    return response.data;
  },

  update: async (id: string, data: CreateTeamRequest): Promise<ApiResponse<TeamResponse>> => {
    const response = await api.put<ApiResponse<TeamResponse>>(`/teams/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/teams/${id}`);
    return response.data;
  },

  getInviteCode: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.get<ApiResponse<InviteCodeResponse>>(`/teams/${id}/invite-code`);
    return response.data;
  },

  regenerateInvite: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.post<ApiResponse<InviteCodeResponse>>(`/teams/${id}/regenerate-invite`);
    return response.data;
  },

  join: async (data: JoinTeamRequest): Promise<ApiResponse<TeamResponse>> => {
    const response = await api.post<ApiResponse<TeamResponse>>('/teams/join', data);
    return response.data;
  },
};
