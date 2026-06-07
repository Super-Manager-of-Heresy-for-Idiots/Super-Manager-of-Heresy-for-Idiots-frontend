import api from './axios';
import type {
  ApiResponse,
  GmSessionNoteResponse,
  CreateGmNoteRequest,
  UpdateGmNoteRequest,
} from '@/types';

export const gmNotesApi = {
  list: async (campaignId: string): Promise<ApiResponse<GmSessionNoteResponse[]>> => {
    const response = await api.get<ApiResponse<GmSessionNoteResponse[]>>(`/campaigns/${campaignId}/gm-notes`);
    return response.data;
  },

  getById: async (campaignId: string, noteId: string): Promise<ApiResponse<GmSessionNoteResponse>> => {
    const response = await api.get<ApiResponse<GmSessionNoteResponse>>(`/campaigns/${campaignId}/gm-notes/${noteId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateGmNoteRequest): Promise<ApiResponse<GmSessionNoteResponse>> => {
    const response = await api.post<ApiResponse<GmSessionNoteResponse>>(`/campaigns/${campaignId}/gm-notes`, data);
    return response.data;
  },

  update: async (campaignId: string, noteId: string, data: UpdateGmNoteRequest): Promise<ApiResponse<GmSessionNoteResponse>> => {
    const response = await api.put<ApiResponse<GmSessionNoteResponse>>(`/campaigns/${campaignId}/gm-notes/${noteId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, noteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/gm-notes/${noteId}`);
    return response.data;
  },
};
