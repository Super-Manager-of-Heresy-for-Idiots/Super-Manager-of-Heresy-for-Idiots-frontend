import api from './axios';
import type {
  ApiResponse,
  CampaignHomebrewResponse,
  AttachHomebrewRequest,
  PinHomebrewVersionRequest,
  TeamAvailableContentResponse,
} from '@/types';

export const homebrewV2Api = {
  // Attach homebrew package to campaign
  attach: async (campaignId: string, data: AttachHomebrewRequest): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.post<ApiResponse<CampaignHomebrewResponse>>(`/campaigns/${campaignId}/homebrew`, data);
    return response.data;
  },

  // Detach homebrew from campaign
  detach: async (campaignId: string, packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/homebrew/${packageId}`);
    return response.data;
  },

  // Update pinned version
  pinVersion: async (campaignId: string, packageId: string, data: PinHomebrewVersionRequest): Promise<ApiResponse<CampaignHomebrewResponse>> => {
    const response = await api.put<ApiResponse<CampaignHomebrewResponse>>(`/campaigns/${campaignId}/homebrew/${packageId}/version`, data);
    return response.data;
  },

  // List active homebrew in campaign
  listAttached: async (campaignId: string): Promise<ApiResponse<CampaignHomebrewResponse[]>> => {
    const response = await api.get<ApiResponse<CampaignHomebrewResponse[]>>(`/campaigns/${campaignId}/homebrew`);
    return response.data;
  },

  // Get available content (global + homebrew)
  getAvailableContent: async (campaignId: string): Promise<ApiResponse<TeamAvailableContentResponse>> => {
    const response = await api.get<ApiResponse<TeamAvailableContentResponse>>(`/campaigns/${campaignId}/available-content`);
    return response.data;
  },
};
