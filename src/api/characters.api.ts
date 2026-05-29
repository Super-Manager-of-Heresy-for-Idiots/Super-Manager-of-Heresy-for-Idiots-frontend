import api from './axios';
import type {
  ApiResponse,
  CharacterResponse,
  CharacterStatResponse,
  InventorySlotResponse,
  CreateCharacterRequest,
  UpdateCharacterRequest,
  UpdateStatRequest,
  UpdateInventorySlotRequest,
  EquipmentSlot,
} from '@/types';

export const charactersApi = {
  list: async (): Promise<ApiResponse<CharacterResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterResponse[]>>('/characters');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.get<ApiResponse<CharacterResponse>>(`/characters/${id}`);
    return response.data;
  },

  create: async (data: CreateCharacterRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>('/characters', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCharacterRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.put<ApiResponse<CharacterResponse>>(`/characters/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/characters/${id}`);
    return response.data;
  },

  getStats: async (characterId: string): Promise<ApiResponse<CharacterStatResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterStatResponse[]>>(`/characters/${characterId}/stats`);
    return response.data;
  },

  updateStat: async (characterId: string, statId: string, data: UpdateStatRequest): Promise<ApiResponse<CharacterStatResponse>> => {
    const response = await api.put<ApiResponse<CharacterStatResponse>>(`/characters/${characterId}/stats/${statId}`, data);
    return response.data;
  },

  getInventory: async (characterId: string): Promise<ApiResponse<InventorySlotResponse[]>> => {
    const response = await api.get<ApiResponse<InventorySlotResponse[]>>(`/characters/${characterId}/inventory`);
    return response.data;
  },

  updateInventorySlot: async (
    characterId: string,
    slot: EquipmentSlot,
    data: UpdateInventorySlotRequest
  ): Promise<ApiResponse<InventorySlotResponse>> => {
    const response = await api.put<ApiResponse<InventorySlotResponse>>(`/characters/${characterId}/inventory/${slot}`, data);
    return response.data;
  },
};
