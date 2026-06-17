import { AxiosError } from 'axios';
import api from './axios';
import type {
  ApiResponse,
  Page,
  CampaignBlueprintResponse,
  CampaignBlueprintDetailResponse,
  CampaignBlueprintSort,
  CreateCampaignBlueprintRequest,
  UpdateCampaignBlueprintRequest,
  InstantiateBlueprintRequest,
  CreateBlueprintNpcRequest,
  UpdateBlueprintNpcRequest,
  BlueprintNpcResponse,
  CreateBlueprintQuestRequest,
  UpdateBlueprintQuestRequest,
  BlueprintQuestResponse,
  CreateBlueprintLocationRequest,
  UpdateBlueprintLocationRequest,
  BlueprintLocationResponse,
  CreateQuestRewardRequest,
  QuestRewardResponse,
  AttachHomebrewRequest,
  CampaignResponse,
} from '@/types';

/**
 * The blueprint backend is only static-compiled in this build (migrations not
 * run, endpoints not served). Treat "not implemented / not found" as a soft
 * signal so the UI can degrade gracefully instead of throwing.
 */
const NOT_IMPLEMENTED_STATUSES = new Set([404, 405, 501]);

export function isBlueprintEndpointMissing(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  return status !== undefined && NOT_IMPLEMENTED_STATUSES.has(status);
}

export interface BlueprintMarketplaceParams {
  search?: string;
  universe?: string;
  tags?: string;
  sort?: CampaignBlueprintSort;
  page?: number;
  size?: number;
}

const BASE = '/campaign-blueprints';

export const campaignBlueprintsApi = {
  // === Authoring (owner) ===

  create: async (
    data: CreateCampaignBlueprintRequest,
  ): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(BASE, data);
    return response.data;
  },

  getMy: async (): Promise<ApiResponse<Page<CampaignBlueprintResponse>>> => {
    const response = await api.get<ApiResponse<Page<CampaignBlueprintResponse>>>(`${BASE}/my`);
    return response.data;
  },

  getMyOne: async (id: string): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.get<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/my/${id}`);
    return response.data;
  },

  update: async (
    id: string,
    data: UpdateCampaignBlueprintRequest,
  ): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.put<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/my/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}`);
    return response.data;
  },

  publish: async (id: string): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/my/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/my/${id}/unpublish`);
    return response.data;
  },

  // === Narrative: NPCs ===

  createNpc: async (
    id: string,
    data: CreateBlueprintNpcRequest,
  ): Promise<ApiResponse<BlueprintNpcResponse>> => {
    const response = await api.post<ApiResponse<BlueprintNpcResponse>>(`${BASE}/my/${id}/npcs`, data);
    return response.data;
  },

  updateNpc: async (
    id: string,
    npcId: string,
    data: UpdateBlueprintNpcRequest,
  ): Promise<ApiResponse<BlueprintNpcResponse>> => {
    const response = await api.put<ApiResponse<BlueprintNpcResponse>>(`${BASE}/my/${id}/npcs/${npcId}`, data);
    return response.data;
  },

  deleteNpc: async (id: string, npcId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}/npcs/${npcId}`);
    return response.data;
  },

  // === Narrative: Quests ===

  createQuest: async (
    id: string,
    data: CreateBlueprintQuestRequest,
  ): Promise<ApiResponse<BlueprintQuestResponse>> => {
    const response = await api.post<ApiResponse<BlueprintQuestResponse>>(`${BASE}/my/${id}/quests`, data);
    return response.data;
  },

  updateQuest: async (
    id: string,
    questId: string,
    data: UpdateBlueprintQuestRequest,
  ): Promise<ApiResponse<BlueprintQuestResponse>> => {
    const response = await api.put<ApiResponse<BlueprintQuestResponse>>(`${BASE}/my/${id}/quests/${questId}`, data);
    return response.data;
  },

  deleteQuest: async (id: string, questId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}/quests/${questId}`);
    return response.data;
  },

  addQuestReward: async (
    id: string,
    questId: string,
    data: CreateQuestRewardRequest,
  ): Promise<ApiResponse<QuestRewardResponse>> => {
    const response = await api.post<ApiResponse<QuestRewardResponse>>(
      `${BASE}/my/${id}/quests/${questId}/rewards`,
      data,
    );
    return response.data;
  },

  listQuestRewards: async (
    id: string,
    questId: string,
  ): Promise<ApiResponse<QuestRewardResponse[]>> => {
    const response = await api.get<ApiResponse<QuestRewardResponse[]>>(
      `${BASE}/my/${id}/quests/${questId}/rewards`,
    );
    return response.data;
  },

  deleteQuestReward: async (
    id: string,
    questId: string,
    rewardId: string,
  ): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `${BASE}/my/${id}/quests/${questId}/rewards/${rewardId}`,
    );
    return response.data;
  },

  // === Narrative: Locations ===

  createLocation: async (
    id: string,
    data: CreateBlueprintLocationRequest,
  ): Promise<ApiResponse<BlueprintLocationResponse>> => {
    const response = await api.post<ApiResponse<BlueprintLocationResponse>>(`${BASE}/my/${id}/locations`, data);
    return response.data;
  },

  updateLocation: async (
    id: string,
    locationId: string,
    data: UpdateBlueprintLocationRequest,
  ): Promise<ApiResponse<BlueprintLocationResponse>> => {
    const response = await api.put<ApiResponse<BlueprintLocationResponse>>(
      `${BASE}/my/${id}/locations/${locationId}`,
      data,
    );
    return response.data;
  },

  deleteLocation: async (id: string, locationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}/locations/${locationId}`);
    return response.data;
  },

  // === Attached homebrew ===

  attachHomebrew: async (
    id: string,
    data: AttachHomebrewRequest,
  ): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/my/${id}/homebrew`, data);
    return response.data;
  },

  detachHomebrew: async (id: string, packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}/homebrew/${packageId}`);
    return response.data;
  },

  // === Pre-built characters (link/unlink character templates) ===

  linkCharacter: async (
    id: string,
    characterId: string,
  ): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(
      `${BASE}/my/${id}/characters/${characterId}`,
    );
    return response.data;
  },

  unlinkCharacter: async (id: string, characterId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`${BASE}/my/${id}/characters/${characterId}`);
    return response.data;
  },

  // === Marketplace ===

  browseMarketplace: async (
    params: BlueprintMarketplaceParams = {},
  ): Promise<ApiResponse<Page<CampaignBlueprintResponse>>> => {
    const response = await api.get<ApiResponse<Page<CampaignBlueprintResponse>>>(`${BASE}/marketplace`, { params });
    return response.data;
  },

  getMarketplaceOne: async (id: string): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.get<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/marketplace/${id}`);
    return response.data;
  },

  fork: async (id: string): Promise<ApiResponse<CampaignBlueprintDetailResponse>> => {
    const response = await api.post<ApiResponse<CampaignBlueprintDetailResponse>>(`${BASE}/marketplace/${id}/fork`);
    return response.data;
  },

  // === Instantiate → live campaign ===

  instantiate: async (
    id: string,
    data: InstantiateBlueprintRequest,
  ): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.post<ApiResponse<CampaignResponse>>(`${BASE}/${id}/instantiate`, data);
    return response.data;
  },
};
