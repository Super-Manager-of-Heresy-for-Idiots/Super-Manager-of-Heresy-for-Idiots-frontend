import api from './axios';
import type {
  ApiResponse,
  ItemTemplateResponse,
  CreateItemTemplateRequest,
} from '@/types';

export const itemTemplatesApi = {
  create: async (data: CreateItemTemplateRequest): Promise<ApiResponse<ItemTemplateResponse>> => {
    const response = await api.post<ApiResponse<ItemTemplateResponse>>('/item-templates', data);
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<ItemTemplateResponse>> => {
    const response = await api.get<ApiResponse<ItemTemplateResponse>>(`/item-templates/${id}`);
    return response.data;
  },

  listForCampaign: async (campaignId: string): Promise<ApiResponse<ItemTemplateResponse[]>> => {
    const response = await api.get<ApiResponse<ItemTemplateResponse[]>>(`/item-templates/campaign/${campaignId}`);
    return response.data;
  },

  update: async (id: string, data: CreateItemTemplateRequest): Promise<ApiResponse<ItemTemplateResponse>> => {
    const response = await api.put<ApiResponse<ItemTemplateResponse>>(`/item-templates/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/item-templates/${id}`);
    return response.data;
  },
};
