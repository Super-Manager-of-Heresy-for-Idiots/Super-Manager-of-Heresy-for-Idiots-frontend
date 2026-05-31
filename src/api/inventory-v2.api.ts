import api from './axios';
import type {
  ApiResponse,
  ItemInstanceResponse,
  GrantItemRequest,
  RenameItemRequest,
  TransferItemRequest,
  EquipItemRequest,
  EnchantmentResponse,
  CreateEnchantmentRequest,
} from '@/types';

export const inventoryV2Api = {
  list: async (campaignId: string, characterId: string): Promise<ApiResponse<ItemInstanceResponse[]>> => {
    const response = await api.get<ApiResponse<ItemInstanceResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/inventory`);
    return response.data;
  },

  listEquipped: async (campaignId: string, characterId: string): Promise<ApiResponse<ItemInstanceResponse[]>> => {
    const response = await api.get<ApiResponse<ItemInstanceResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/equipped`);
    return response.data;
  },

  listBackpack: async (campaignId: string, characterId: string): Promise<ApiResponse<ItemInstanceResponse[]>> => {
    const response = await api.get<ApiResponse<ItemInstanceResponse[]>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/backpack`);
    return response.data;
  },

  grant: async (campaignId: string, characterId: string, data: GrantItemRequest): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(`/campaigns/${campaignId}/characters/${characterId}/inventory`, data);
    return response.data;
  },

  remove: async (campaignId: string, characterId: string, instanceId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}`);
    return response.data;
  },

  equip: async (campaignId: string, characterId: string, instanceId: string, data: EquipItemRequest): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/equip`, data);
    return response.data;
  },

  unequip: async (campaignId: string, characterId: string, instanceId: string): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/unequip`);
    return response.data;
  },

  rename: async (campaignId: string, characterId: string, instanceId: string, data: RenameItemRequest): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.put<ApiResponse<ItemInstanceResponse>>(`/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/rename`, data);
    return response.data;
  },

  transfer: async (campaignId: string, characterId: string, instanceId: string, data: TransferItemRequest): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(
      `/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/transfer`,
      data,
    );
    return response.data;
  },

  // Enchantments on item instances
  getEnchantments: async (campaignId: string, characterId: string, instanceId: string): Promise<ApiResponse<EnchantmentResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentResponse[]>>(
      `/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/enchantments`,
    );
    return response.data;
  },

  addEnchantment: async (campaignId: string, characterId: string, instanceId: string, data: CreateEnchantmentRequest): Promise<ApiResponse<EnchantmentResponse>> => {
    const response = await api.post<ApiResponse<EnchantmentResponse>>(
      `/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/enchantments`,
      data,
    );
    return response.data;
  },

  removeEnchantment: async (campaignId: string, characterId: string, instanceId: string, enchantmentId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/campaigns/${campaignId}/characters/${characterId}/inventory/${instanceId}/enchantments/${enchantmentId}`,
    );
    return response.data;
  },
};
