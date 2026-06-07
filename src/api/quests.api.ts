import api from './axios';
import type {
  ApiResponse,
  QuestResponse,
  CreateQuestRequest,
  UpdateQuestRequest,
  NoteResponse,
  CreateNoteRequest,
  UpdateNoteRequest,
  QuestRewardResponse,
  CreateQuestRewardRequest,
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
  addNote: async (campaignId: string, questId: string, data: CreateNoteRequest): Promise<ApiResponse<NoteResponse>> => {
    const response = await api.post<ApiResponse<NoteResponse>>(`/campaigns/${campaignId}/quests/${questId}/notes`, data);
    return response.data;
  },

  updateNote: async (campaignId: string, questId: string, noteId: string, data: UpdateNoteRequest): Promise<ApiResponse<NoteResponse>> => {
    const response = await api.put<ApiResponse<NoteResponse>>(`/campaigns/${campaignId}/quests/${questId}/notes/${noteId}`, data);
    return response.data;
  },

  deleteNote: async (campaignId: string, questId: string, noteId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/notes/${noteId}`);
    return response.data;
  },

  // NPC linking
  linkNpc: async (campaignId: string, questId: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/npcs/${npcId}`);
    return response.data;
  },

  unlinkNpc: async (campaignId: string, questId: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/npcs/${npcId}`);
    return response.data;
  },

  // Location linking
  linkLocation: async (campaignId: string, questId: string, locationId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/locations/${locationId}`);
    return response.data;
  },

  unlinkLocation: async (campaignId: string, questId: string, locationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/locations/${locationId}`);
    return response.data;
  },

  // Rewards
  listRewards: async (campaignId: string, questId: string): Promise<ApiResponse<QuestRewardResponse[]>> => {
    const response = await api.get<ApiResponse<QuestRewardResponse[]>>(`/campaigns/${campaignId}/quests/${questId}/rewards`);
    return response.data;
  },

  addReward: async (campaignId: string, questId: string, data: CreateQuestRewardRequest): Promise<ApiResponse<QuestRewardResponse>> => {
    const response = await api.post<ApiResponse<QuestRewardResponse>>(`/campaigns/${campaignId}/quests/${questId}/rewards`, data);
    return response.data;
  },

  deleteReward: async (campaignId: string, questId: string, rewardId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/quests/${questId}/rewards/${rewardId}`);
    return response.data;
  },
};
