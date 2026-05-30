import api from './axios';
import type {
  ApiResponse,
  ItemInstance,
  GrantItemRequest,
  RenameItemRequest,
  TransferItemRequest,
  EquipItemRequest,
  EnchantmentResponse,
  CreateEnchantmentRequest,
} from '@/types';

export const inventoryV2Api = {
  list: async (characterId: string): Promise<ApiResponse<ItemInstance[]>> => {
    const response = await api.get<ApiResponse<ItemInstance[]>>(`/characters/${characterId}/inventory`);
    return response.data;
  },

  grant: async (characterId: string, data: GrantItemRequest): Promise<ApiResponse<ItemInstance>> => {
    const response = await api.post<ApiResponse<ItemInstance>>(`/characters/${characterId}/inventory`, data);
    return response.data;
  },

  remove: async (characterId: string, instanceId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/characters/${characterId}/inventory/${instanceId}`);
    return response.data;
  },

  equip: async (characterId: string, instanceId: string, data: EquipItemRequest): Promise<ApiResponse<ItemInstance>> => {
    const response = await api.put<ApiResponse<ItemInstance>>(`/characters/${characterId}/inventory/${instanceId}/equip`, data);
    return response.data;
  },

  rename: async (characterId: string, instanceId: string, data: RenameItemRequest): Promise<ApiResponse<ItemInstance>> => {
    const response = await api.put<ApiResponse<ItemInstance>>(`/characters/${characterId}/inventory/${instanceId}/rename`, data);
    return response.data;
  },

  transfer: async (campaignId: string, fromCharId: string, instanceId: string, data: TransferItemRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(
      `/campaigns/${campaignId}/characters/${fromCharId}/inventory/${instanceId}/transfer`,
      data,
    );
    return response.data;
  },

  // Enchantments on instances
  getEnchantments: async (characterId: string, instanceId: string): Promise<ApiResponse<EnchantmentResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentResponse[]>>(`/characters/${characterId}/inventory/${instanceId}/enchantments`);
    return response.data;
  },

  addEnchantment: async (characterId: string, instanceId: string, data: CreateEnchantmentRequest): Promise<ApiResponse<EnchantmentResponse>> => {
    const response = await api.post<ApiResponse<EnchantmentResponse>>(`/characters/${characterId}/inventory/${instanceId}/enchantments`, data);
    return response.data;
  },

  removeEnchantment: async (characterId: string, instanceId: string, enchId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/characters/${characterId}/inventory/${instanceId}/enchantments/${enchId}`);
    return response.data;
  },
};
