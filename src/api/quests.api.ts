import api from './axios';
import type {
  ApiResponse,
  QuestResponse,
  CreateQuestRequest,
  UpdateQuestRequest,
  QuestNoteResponse,
  CreateQuestNoteRequest,
} from '@/types';

export const questsApi = {
  list: async (campaignId: string): Promise<ApiResponse<QuestResponse[]>> => {
    const response = await api.get<ApiResponse<QuestResponse[]>>(`/campaigns/${campaignId}/quests`);
    return response.data;
  },

  getById: async (campaignId: string, questId: string): Promise<ApiResponse<QuestResponse>> => {
    const response = await api.get<ApiResponse<QuestResponse>>(`/campaigns/${campaignId}/quests/${questId}`);
    return response.data;
  },

  create: async (campaignId: string, data: CreateQuestRequest): Promise<ApiResponse<QuestResponse>> => {
    const response = await api.post<ApiResponse<QuestResponse>>(`/campaigns/${campaignId}/quests`, data);
    return response.data;
  },

  update: async (campaignId: string, questId: string, data: UpdateQuestRequest): Promise<ApiResponse<QuestResponse>> => {
    const response = await api.put<ApiResponse<QuestResponse>>(`/campaigns/${campaignId}/quests/${questId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, questId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}`);
    return response.data;
  },

  // Notes
  listNotes: async (campaignId: string, questId: string): Promise<ApiResponse<QuestNoteResponse[]>> => {
    const response = await api.get<ApiResponse<QuestNoteResponse[]>>(`/campaigns/${campaignId}/quests/${questId}/notes`);
    return response.data;
  },

  addNote: async (campaignId: string, questId: string, data: CreateQuestNoteRequest): Promise<ApiResponse<QuestNoteResponse>> => {
    const response = await api.post<ApiResponse<QuestNoteResponse>>(`/campaigns/${campaignId}/quests/${questId}/notes`, data);
    return response.data;
  },
};
