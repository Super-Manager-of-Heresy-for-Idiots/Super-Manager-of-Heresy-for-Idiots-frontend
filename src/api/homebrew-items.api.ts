import api from './axios';
import type { ApiResponse, HomebrewItemRequest, HomebrewItemResponse } from '@/types';

/**
 * Авторинг единого homebrew-предмета (P1.5 / IT-2). Пути package-scoped:
 * /api/homebrew/packages/{packageId}/items[/{itemId}]. Реализован kind=MAGIC.
 */
export const homebrewItemsApi = {
  get: async (packageId: string, itemId: string): Promise<ApiResponse<HomebrewItemResponse>> => {
    const response = await api.get<ApiResponse<HomebrewItemResponse>>(`/homebrew/packages/${packageId}/items/${itemId}`);
    return response.data;
  },
  create: async (packageId: string, data: HomebrewItemRequest): Promise<ApiResponse<HomebrewItemResponse>> => {
    const response = await api.post<ApiResponse<HomebrewItemResponse>>(`/homebrew/packages/${packageId}/items`, data);
    return response.data;
  },
  update: async (packageId: string, itemId: string, data: HomebrewItemRequest): Promise<ApiResponse<HomebrewItemResponse>> => {
    const response = await api.put<ApiResponse<HomebrewItemResponse>>(`/homebrew/packages/${packageId}/items/${itemId}`, data);
    return response.data;
  },
  remove: async (packageId: string, itemId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/packages/${packageId}/items/${itemId}`);
    return response.data;
  },
};
