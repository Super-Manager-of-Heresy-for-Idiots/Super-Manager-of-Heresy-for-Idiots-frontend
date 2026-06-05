import api from './axios';
import type {
  ApiResponse,
  AttachHomebrewRequest,
  CampaignHomebrewResponse,
  PinHomebrewVersionRequest,
  TeamAvailableContentResponse,
} from '@/types';

export const homebrewV2Api = {
  attach: async (campaignId: string, data: AttachHomebrewRequest): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.post<ApiResponse<CampaignHomebrewResponse>>(`/campaigns/${campaignId}/homebrew`, data);
    return response.data;
  },

  detach: async (campaignId: string, packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/homebrew/${packageId}`);
    return response.data;
  },

  listAttached: async (campaignId: string): Promise<ApiResponse<CampaignHomebrewResponse[]>> => {
    const response = await api.get<ApiResponse<CampaignHomebrewResponse[]>>(`/campaigns/${campaignId}/homebrew`);
    return response.data;
  },

  pinVersion: async (
    campaignId: string,
    packageId: string,
    data: PinHomebrewVersionRequest,
  ): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.put<ApiResponse<CampaignHomebrewResponse>>(
      `/campaigns/${campaignId}/homebrew/${packageId}/pin`,
      data,
    );
    return response.data;
  },

  getAvailableContent: async (campaignId: string): Promise<ApiResponse<TeamAvailableContentResponse>> => {
    const response = await api.get<ApiResponse<TeamAvailableContentResponse>>(`/campaigns/${campaignId}/available-content`);
    return response.data;
  },
};
