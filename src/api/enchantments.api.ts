import api from './axios';
import type {
  ApiResponse,
  EnchantmentTypeResponse,
} from '@/types';

export const enchantmentsApi = {
  // Public read-only catalog of enchantment types (all authenticated users)
  getTypes: async (): Promise<ApiResponse<EnchantmentTypeResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentTypeResponse[]>>('/enchantment-types');
    return response.data;
  },
};
