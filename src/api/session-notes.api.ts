import api from './axios';
import type {
  ApiResponse,
  SessionNoteResponse,
  CreateSessionNoteRequest,
  UpdateSessionNoteRequest,
} from '@/types';

export const sessionNotesApi = {
  list: async (campaignId: string): Promise<ApiResponse<SessionNoteResponse[]>> => {
    const response = await api.get<ApiResponse<SessionNoteResponse[]>>(`/campaigns/${campaignId}/session-notes`);
    return response.data;
  },

  getById: async (campaignId: string, noteId: string): Promise<ApiResponse<SessionNoteResponse>> => {
    const response = await api.get<ApiResponse<SessionNoteResponse>>(`/campaigns/${campaignId}/session-notes/${noteId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateSessionNoteRequest): Promise<ApiResponse<SessionNoteResponse>> => {
    const response = await api.post<ApiResponse<SessionNoteResponse>>(`/campaigns/${campaignId}/session-notes`, data);
    return response.data;
  },

  update: async (campaignId: string, noteId: string, data: UpdateSessionNoteRequest): Promise<ApiResponse<SessionNoteResponse>> => {
    const response = await api.put<ApiResponse<SessionNoteResponse>>(`/campaigns/${campaignId}/session-notes/${noteId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, noteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/session-notes/${noteId}`);
    return response.data;
  },
};
