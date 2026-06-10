import api from './axios';
import type {
  ApiResponse,
  DictionaryEntryRequest,
  DictionaryEntryResponse,
  DictionaryKind,
  MonsterRequest,
  MonsterResponse,
  MonsterSummaryResponse,
} from '@/types';

/**
 * Bestiary API clients, one object per contract section (3.1–3.4):
 *  - adminBestiaryApi      → /api/admin/bestiary        (ADMIN, system scope)
 *  - bestiaryApi           → /api/bestiary              (any authed, read-only)
 *  - homebrewBestiaryApi   → /api/homebrew/{pkg}/bestiary (GAME_MASTER, DRAFT package)
 *  - campaignMonsterApi    → /api/campaigns/{cid}/monsters (campaign GM / members)
 *
 * Every method returns the unwrapped `ApiResponse<T>` envelope (axios already
 * surfaces `success=false` as a rejected promise — see api/axios.ts).
 */

// === 3.1 ADMIN — system bestiary (`/admin/bestiary`) ===
export const adminBestiaryApi = {
  // Dictionaries
  getDictionary: async (kind: DictionaryKind): Promise<ApiResponse<DictionaryEntryResponse[]>> => {
    const response = await api.get<ApiResponse<DictionaryEntryResponse[]>>(`/admin/bestiary/dictionaries/${kind}`);
    return response.data;
  },
  createDictionaryEntry: async (kind: DictionaryKind, data: DictionaryEntryRequest): Promise<ApiResponse<DictionaryEntryResponse>> => {
    const response = await api.post<ApiResponse<DictionaryEntryResponse>>(`/admin/bestiary/dictionaries/${kind}`, data);
    return response.data;
  },
  updateDictionaryEntry: async (kind: DictionaryKind, id: string, data: DictionaryEntryRequest): Promise<ApiResponse<DictionaryEntryResponse>> => {
    const response = await api.put<ApiResponse<DictionaryEntryResponse>>(`/admin/bestiary/dictionaries/${kind}/${id}`, data);
    return response.data;
  },
  deleteDictionaryEntry: async (kind: DictionaryKind, id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/bestiary/dictionaries/${kind}/${id}`);
    return response.data;
  },

  // Monsters
  getMonsters: async (): Promise<ApiResponse<MonsterSummaryResponse[]>> => {
    const response = await api.get<ApiResponse<MonsterSummaryResponse[]>>('/admin/bestiary/monsters');
    return response.data;
  },
  getMonster: async (id: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.get<ApiResponse<MonsterResponse>>(`/admin/bestiary/monsters/${id}`);
    return response.data;
  },
  createMonster: async (data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>('/admin/bestiary/monsters', data);
    return response.data;
  },
  updateMonster: async (id: string, data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.put<ApiResponse<MonsterResponse>>(`/admin/bestiary/monsters/${id}`, data);
    return response.data;
  },
  setMonsterActive: async (id: string, active: boolean): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/admin/bestiary/monsters/${id}/active`, null, { params: { active } });
    return response.data;
  },
  deleteMonster: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/bestiary/monsters/${id}`);
    return response.data;
  },
};

// === 3.2 Any authed — read-only system view (`/bestiary`) ===
export const bestiaryApi = {
  getDictionary: async (kind: DictionaryKind): Promise<ApiResponse<DictionaryEntryResponse[]>> => {
    const response = await api.get<ApiResponse<DictionaryEntryResponse[]>>(`/bestiary/dictionaries/${kind}`);
    return response.data;
  },
  getMonsters: async (): Promise<ApiResponse<MonsterSummaryResponse[]>> => {
    const response = await api.get<ApiResponse<MonsterSummaryResponse[]>>('/bestiary/monsters');
    return response.data;
  },
  getMonster: async (id: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.get<ApiResponse<MonsterResponse>>(`/bestiary/monsters/${id}`);
    return response.data;
  },
};

// === 3.3 GAME_MASTER — homebrew package bestiary (`/homebrew/{packageId}/bestiary`) ===
export const homebrewBestiaryApi = {
  getDictionary: async (packageId: string, kind: DictionaryKind): Promise<ApiResponse<DictionaryEntryResponse[]>> => {
    const response = await api.get<ApiResponse<DictionaryEntryResponse[]>>(`/homebrew/${packageId}/bestiary/dictionaries/${kind}`);
    return response.data;
  },
  createDictionaryEntry: async (packageId: string, kind: DictionaryKind, data: DictionaryEntryRequest): Promise<ApiResponse<DictionaryEntryResponse>> => {
    const response = await api.post<ApiResponse<DictionaryEntryResponse>>(`/homebrew/${packageId}/bestiary/dictionaries/${kind}`, data);
    return response.data;
  },
  updateDictionaryEntry: async (packageId: string, kind: DictionaryKind, id: string, data: DictionaryEntryRequest): Promise<ApiResponse<DictionaryEntryResponse>> => {
    const response = await api.put<ApiResponse<DictionaryEntryResponse>>(`/homebrew/${packageId}/bestiary/dictionaries/${kind}/${id}`, data);
    return response.data;
  },
  deleteDictionaryEntry: async (packageId: string, kind: DictionaryKind, id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/${packageId}/bestiary/dictionaries/${kind}/${id}`);
    return response.data;
  },

  getMonsters: async (packageId: string): Promise<ApiResponse<MonsterSummaryResponse[]>> => {
    const response = await api.get<ApiResponse<MonsterSummaryResponse[]>>(`/homebrew/${packageId}/bestiary/monsters`);
    return response.data;
  },
  getMonster: async (packageId: string, id: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.get<ApiResponse<MonsterResponse>>(`/homebrew/${packageId}/bestiary/monsters/${id}`);
    return response.data;
  },
  createMonster: async (packageId: string, data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/homebrew/${packageId}/bestiary/monsters`, data);
    return response.data;
  },
  /** Deep-fork a system/homebrew monster into this package (new unique slug). */
  duplicateMonster: async (packageId: string, sourceId: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/homebrew/${packageId}/bestiary/monsters/duplicate/${sourceId}`);
    return response.data;
  },
  updateMonster: async (packageId: string, id: string, data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.put<ApiResponse<MonsterResponse>>(`/homebrew/${packageId}/bestiary/monsters/${id}`, data);
    return response.data;
  },
  deleteMonster: async (packageId: string, id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/${packageId}/bestiary/monsters/${id}`);
    return response.data;
  },
};

// === 3.4 Campaign GM — campaign monsters (`/campaigns/{campaignId}/monsters`) ===
export const campaignMonsterApi = {
  getMonsters: async (campaignId: string): Promise<ApiResponse<MonsterSummaryResponse[]>> => {
    const response = await api.get<ApiResponse<MonsterSummaryResponse[]>>(`/campaigns/${campaignId}/monsters`);
    return response.data;
  },
  getMonster: async (campaignId: string, id: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.get<ApiResponse<MonsterResponse>>(`/campaigns/${campaignId}/monsters/${id}`);
    return response.data;
  },
  createMonster: async (campaignId: string, data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/campaigns/${campaignId}/monsters`, data);
    return response.data;
  },
  /** Clone a system/homebrew/campaign monster into this campaign (created hidden). */
  cloneMonster: async (campaignId: string, sourceId: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/campaigns/${campaignId}/monsters/clone/${sourceId}`);
    return response.data;
  },
  updateMonster: async (campaignId: string, id: string, data: MonsterRequest): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.put<ApiResponse<MonsterResponse>>(`/campaigns/${campaignId}/monsters/${id}`, data);
    return response.data;
  },
  toggleVisibility: async (campaignId: string, id: string): Promise<ApiResponse<MonsterResponse>> => {
    const response = await api.post<ApiResponse<MonsterResponse>>(`/campaigns/${campaignId}/monsters/${id}/toggle-visibility`);
    return response.data;
  },
  deleteMonster: async (campaignId: string, id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/monsters/${id}`);
    return response.data;
  },
};
