import api from './axios';
import type {
  ApiResponse,
  EnchantmentTypeResponse,
  EnchantmentResponse,
  CreateEnchantmentRequest,
} from '@/types';

export const enchantmentsApi = {
  // Public read-only catalog of enchantment types (all authenticated users)
  getTypes: async (): Promise<ApiResponse<EnchantmentTypeResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentTypeResponse[]>>('/enchantment-types');
    return response.data;
  },

  getSlotEnchantments: async (characterId: string, slotId: string): Promise<ApiResponse<EnchantmentResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentResponse[]>>(`/characters/${characterId}/inventory/${slotId}/enchantments`);
    return response.data;
  },

  addEnchantment: async (characterId: string, slotId: string, data: CreateEnchantmentRequest): Promise<ApiResponse<EnchantmentResponse>> => {
    const response = await api.post<ApiResponse<EnchantmentResponse>>(`/characters/${characterId}/inventory/${slotId}/enchantments`, data);
    return response.data;
  },

  removeEnchantment: async (characterId: string, slotId: string, enchantmentId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/characters/${characterId}/inventory/${slotId}/enchantments/${enchantmentId}`);
    return response.data;
  },
};
