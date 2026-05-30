import api from './axios';
import type {
  ApiResponse,
  CharacterV2Response,
  CreateCharacterInCampaignRequest,
  SetCharacterStatusRequest,
  UpdateHpRequest,
  WalletEntry,
  UpdateWalletRequest,
  ResourceEntry,
  UpdateResourceRequest,
  AbilityCheckResult,
} from '@/types';

export const charactersV2Api = {
  createInCampaign: async (campaignId: string, data: CreateCharacterInCampaignRequest): Promise<ApiResponse<CharacterV2Response>> => {
    const response = await api.post<ApiResponse<CharacterV2Response>>(`/campaigns/${campaignId}/characters`, data);
    return response.data;
  },

  listInCampaign: async (campaignId: string): Promise<ApiResponse<CharacterV2Response[]>> => {
    const response = await api.get<ApiResponse<CharacterV2Response[]>>(`/campaigns/${campaignId}/characters`);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CharacterV2Response>> => {
    const response = await api.get<ApiResponse<CharacterV2Response>>(`/characters/${id}`);
    return response.data;
  },

  setStatus: async (id: string, data: SetCharacterStatusRequest): Promise<ApiResponse<CharacterV2Response>> => {
    const response = await api.put<ApiResponse<CharacterV2Response>>(`/characters/${id}/status`, data);
    return response.data;
  },

  updateHp: async (id: string, data: UpdateHpRequest): Promise<ApiResponse<CharacterV2Response>> => {
    const response = await api.put<ApiResponse<CharacterV2Response>>(`/characters/${id}/hp`, data);
    return response.data;
  },

  getWallet: async (id: string): Promise<ApiResponse<WalletEntry[]>> => {
    const response = await api.get<ApiResponse<WalletEntry[]>>(`/characters/${id}/wallet`);
    return response.data;
  },

  updateWallet: async (id: string, currencyTypeId: string, data: UpdateWalletRequest): Promise<ApiResponse<WalletEntry>> => {
    const response = await api.put<ApiResponse<WalletEntry>>(`/characters/${id}/wallet/${currencyTypeId}`, data);
    return response.data;
  },

  getResources: async (id: string): Promise<ApiResponse<ResourceEntry[]>> => {
    const response = await api.get<ApiResponse<ResourceEntry[]>>(`/characters/${id}/resources`);
    return response.data;
  },

  updateResource: async (id: string, resourceTypeId: string, data: UpdateResourceRequest): Promise<ApiResponse<ResourceEntry>> => {
    const response = await api.put<ApiResponse<ResourceEntry>>(`/characters/${id}/resources/${resourceTypeId}`, data);
    return response.data;
  },

  abilityCheck: async (id: string, statId: string): Promise<ApiResponse<AbilityCheckResult>> => {
    const response = await api.post<ApiResponse<AbilityCheckResult>>(`/characters/${id}/stats/${statId}/check`);
    return response.data;
  },
};
