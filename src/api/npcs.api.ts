import api from './axios';
import type {
  ApiResponse,
  NpcResponse,
  CreateNpcRequest,
  UpdateNpcRequest,
  NoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
} from '@/types';

type NpcNoteResponse = NoteResponse;
type CreateNpcNoteRequest = CreateNoteRequest;
type UpdateNpcNoteRequest = UpdateNoteRequest;

export const npcsApi = {
  list: async (campaignId: string): Promise<ApiResponse<NpcResponse[]>> => {
    const response = await api.get<ApiResponse<NpcResponse[]>>(`/campaigns/${campaignId}/npcs`);
    return response.data;
  },

  getById: async (campaignId: string, npcId: string): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.get<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateNpcRequest): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.post<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs`, data);
    return response.data;
  },

  update: async (campaignId: string, npcId: string, data: UpdateNpcRequest): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.put<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}`);
    return response.data;
  },

  // Notes
  addNote: async (campaignId: string, npcId: string, data: CreateNpcNoteRequest): Promise<ApiResponse<NpcNoteResponse>> => {
    const response = await api.post<ApiResponse<NpcNoteResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/notes`, data);
    return response.data;
  },

  updateNote: async (campaignId: string, npcId: string, noteId: string, data: UpdateNoteRequest): Promise<ApiResponse<NpcNoteResponse>> => {
    const response = await api.put<ApiResponse<NpcNoteResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/notes/${noteId}`, data);
    return response.data;
  },

  deleteNote: async (campaignId: string, npcId: string, noteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/npcs/${npcId}/notes/${noteId}`);
    return response.data;
  },

  toggleVisibility: async (campaignId: string, npcId: string): Promise<ApiResponse<NpcResponse>> => {
    const response = await api.post<ApiResponse<NpcResponse>>(`/campaigns/${campaignId}/npcs/${npcId}/toggle-visibility`);
    return response.data;
  },
};
