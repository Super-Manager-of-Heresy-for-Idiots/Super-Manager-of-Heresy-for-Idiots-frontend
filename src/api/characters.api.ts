import api from './axios';
import type {
  ApiResponse,
  Character,
  CharacterStat,
  InventorySlot,
  CreateCharacterDto,
  UpdateStatDto,
  UpdateInventoryDto,
  EquipmentSlot,
} from '@/types';

export const charactersApi = {
  list: async (): Promise<ApiResponse<Character[]>> => {
    const response = await api.get<ApiResponse<Character[]>>('/characters');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<Character>> => {
    const response = await api.get<ApiResponse<Character>>(`/characters/${id}`);
    return response.data;
  },

  create: async (data: CreateCharacterDto): Promise<ApiResponse<Character>> => {
    const response = await api.post<ApiResponse<Character>>('/characters', data);
    return response.data;
  },

  update: async (id: string, data: CreateCharacterDto): Promise<ApiResponse<Character>> => {
    const response = await api.put<ApiResponse<Character>>(`/characters/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/characters/${id}`);
    return response.data;
  },

  getStats: async (characterId: string): Promise<ApiResponse<CharacterStat[]>> => {
    const response = await api.get<ApiResponse<CharacterStat[]>>(`/characters/${characterId}/stats`);
    return response.data;
  },

  updateStat: async (characterId: string, statId: string, data: UpdateStatDto): Promise<ApiResponse<CharacterStat>> => {
    const response = await api.put<ApiResponse<CharacterStat>>(`/characters/${characterId}/stats/${statId}`, data);
    return response.data;
  },

  getInventory: async (characterId: string): Promise<ApiResponse<InventorySlot[]>> => {
    const response = await api.get<ApiResponse<InventorySlot[]>>(`/characters/${characterId}/inventory`);
    return response.data;
  },

  updateInventorySlot: async (
    characterId: string,
    slot: EquipmentSlot,
    data: UpdateInventoryDto
  ): Promise<ApiResponse<InventorySlot>> => {
    const response = await api.put<ApiResponse<InventorySlot>>(`/characters/${characterId}/inventory/${slot}`, data);
    return response.data;
  },
};
