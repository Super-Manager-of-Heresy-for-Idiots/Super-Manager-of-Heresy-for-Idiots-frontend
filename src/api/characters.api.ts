import api from './axios';
import type {
  ApiResponse,
  CharacterResponse,
  CreateCharacterInCampaignRequest,
  UpdateCharacterRequest,
  UpdateHpRequest,
  UpdateStatRequest,
  WalletEntryResponse,
  ModifyWalletRequest,
  WalletHistoryEntry,
  CurrencyTypeResponse,
  PageResponse,
  ResourceResponse,
  ModifyResourceRequest,
  AbilityCheckResponse,
  CharacterStatResponse,
} from '@/types';

/** Combined result of one orchestrated rest (resources + feature resources + spell slots + HP). */
export interface RestResult {
  restType: string;
  hp?: { currentHp: number; tempHp: number; maxHp: number; reachedZero: boolean } | null;
}

/** A feat a character has (structured character_feats record). */
export interface CharacterFeat {
  id: string;
  featId: string;
  featName: string | null;
  source: string;
  grantedAt: string | null;
}

/** A hit-dice pool of one die size. */
export interface HitDie {
  die: number;
  total: number;
  remaining: number;
}

export const charactersApi = {
  createInCampaign: async (campaignId: string, data: CreateCharacterInCampaignRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(`/campaigns/${campaignId}/characters`, data);
    return response.data;
  },

  listInCampaign: async (campaignId: string): Promise<ApiResponse<CharacterResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterResponse[]>>(`/campaigns/${campaignId}/characters`);
    return response.data;
  },

  getById: async (campaignId: string, characterId: string): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.get<ApiResponse<CharacterResponse>>(`/campaigns/${campaignId}/characters/${characterId}`);
    return response.data;
  },

  update: async (campaignId: string, characterId: string, data: UpdateCharacterRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.put<ApiResponse<CharacterResponse>>(`/campaigns/${campaignId}/characters/${characterId}`, data);
    return response.data;
  },

  delete: async (campaignId: string, characterId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/characters/${characterId}`);
    return response.data;
  },

  // Stats
  getStats: async (campaignId: string, characterId: string): Promise<ApiResponse<CharacterStatResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterStatResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/stats`);
    return response.data;
  },

  updateStat: async (campaignId: string, characterId: string, statId: string, data: UpdateStatRequest): Promise<ApiResponse<CharacterStatResponse>> => {
    const response = await api.put<ApiResponse<CharacterStatResponse>>(`/campaigns/${campaignId}/characters/${characterId}/stats/${statId}`, data);
    return response.data;
  },

  abilityCheck: async (campaignId: string, characterId: string, statId: string): Promise<ApiResponse<AbilityCheckResponse>> => {
    const response = await api.get<ApiResponse<AbilityCheckResponse>>(`/campaigns/${campaignId}/characters/${characterId}/ability-check/${statId}`);
    return response.data;
  },

  // HP
  modifyHp: async (campaignId: string, characterId: string, data: UpdateHpRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(`/campaigns/${campaignId}/characters/${characterId}/hp`, data);
    return response.data;
  },

  // Rest: one transactional call restoring resources, feature resources, spell slots and HP.
  rest: async (
    campaignId: string,
    characterId: string,
    type: 'long' | 'short',
  ): Promise<ApiResponse<RestResult>> => {
    const response = await api.post<ApiResponse<RestResult>>(
      `/campaigns/${campaignId}/characters/${characterId}/rest`,
      null,
      { params: { type } },
    );
    return response.data;
  },

  // Feats (S1: structured character_feats; adding auto-provisions feat-bound resources).
  listFeats: async (campaignId: string, characterId: string): Promise<ApiResponse<CharacterFeat[]>> => {
    const response = await api.get<ApiResponse<CharacterFeat[]>>(
      `/campaigns/${campaignId}/characters/${characterId}/feats`,
    );
    return response.data;
  },

  addFeat: async (campaignId: string, characterId: string, featId: string): Promise<ApiResponse<CharacterFeat>> => {
    const response = await api.post<ApiResponse<CharacterFeat>>(
      `/campaigns/${campaignId}/characters/${characterId}/feats`,
      null,
      { params: { featId } },
    );
    return response.data;
  },

  removeFeat: async (campaignId: string, characterId: string, featId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/campaigns/${campaignId}/characters/${characterId}/feats/${featId}`,
    );
    return response.data;
  },

  // Hit dice (structured; short-rest spend heals die + CON modifier).
  listHitDice: async (campaignId: string, characterId: string): Promise<ApiResponse<HitDie[]>> => {
    const response = await api.get<ApiResponse<HitDie[]>>(
      `/campaigns/${campaignId}/characters/${characterId}/hit-dice`,
    );
    return response.data;
  },

  spendHitDice: async (
    campaignId: string,
    characterId: string,
    die: number,
    count: number,
    rolledTotal: number,
  ): Promise<ApiResponse<unknown>> => {
    const response = await api.post<ApiResponse<unknown>>(
      `/campaigns/${campaignId}/characters/${characterId}/hit-dice/spend`,
      null,
      { params: { die, count, rolledTotal } },
    );
    return response.data;
  },

  // Campaign currency reference (used by the GM balance manager).
  getCampaignCurrencies: async (campaignId: string): Promise<ApiResponse<CurrencyTypeResponse[]>> => {
    const response = await api.get<ApiResponse<CurrencyTypeResponse[]>>(`/campaigns/${campaignId}/reference/currencies`);
    return response.data;
  },

  // Wallet
  getWallet: async (campaignId: string, characterId: string): Promise<ApiResponse<WalletEntryResponse[]>> => {
    const response = await api.get<ApiResponse<WalletEntryResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/wallet`);
    return response.data;
  },

  modifyWallet: async (campaignId: string, characterId: string, data: ModifyWalletRequest): Promise<ApiResponse<WalletEntryResponse>> => {
    const response = await api.post<ApiResponse<WalletEntryResponse>>(`/campaigns/${campaignId}/characters/${characterId}/wallet`, data);
    return response.data;
  },

  // Wallet history — future endpoint, not yet served by the backend.
  getWalletHistory: async (campaignId: string, characterId: string, page = 0, size = 20): Promise<ApiResponse<PageResponse<WalletHistoryEntry>>> => {
    const response = await api.get<ApiResponse<PageResponse<WalletHistoryEntry>>>(
      `/campaigns/${campaignId}/characters/${characterId}/wallet/history`,
      { params: { page, size } },
    );
    return response.data;
  },

  // Resources
  getResources: async (campaignId: string, characterId: string): Promise<ApiResponse<ResourceResponse[]>> => {
    const response = await api.get<ApiResponse<ResourceResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/resources`);
    return response.data;
  },

  modifyResource: async (campaignId: string, characterId: string, data: ModifyResourceRequest): Promise<ApiResponse<ResourceResponse>> => {
    const response = await api.post<ApiResponse<ResourceResponse>>(`/campaigns/${campaignId}/characters/${characterId}/resources`, data);
    return response.data;
  },
};
