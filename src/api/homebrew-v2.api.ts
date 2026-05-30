import api from './axios';
import type {
  ApiResponse,
  HomebrewPackageResponse,
  HomebrewDetailResponse,
  RateHomebrewRequest,
  HomebrewRating,
  AttachHomebrewRequest,
  PinHomebrewVersionRequest,
  TeamHomebrewActivationResponse,
  CreateOverrideHomebrewRequest,
} from '@/types';

export const homebrewV2Api = {
  // Library (my installed/added doctrines)
  getLibrary: async (): Promise<ApiResponse<HomebrewPackageResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewPackageResponse[]>>('/homebrew/library');
    return response.data;
  },

  // Rating
  rate: async (packageId: string, data: RateHomebrewRequest): Promise<ApiResponse<HomebrewRating>> => {
    const response = await api.post<ApiResponse<HomebrewRating>>(`/homebrew/${packageId}/rate`, data);
    return response.data;
  },

  removeRating: async (packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/${packageId}/rate`);
    return response.data;
  },

  getRating: async (packageId: string): Promise<ApiResponse<HomebrewRating>> => {
    const response = await api.get<ApiResponse<HomebrewRating>>(`/homebrew/${packageId}/rating`);
    return response.data;
  },

  // Attach to campaign
  attach: async (campaignId: string, data: AttachHomebrewRequest): Promise<ApiResponse<TeamHomebrewActivationResponse>> => {
    const response = await api.post<ApiResponse<TeamHomebrewActivationResponse>>(`/campaigns/${campaignId}/homebrew`, data);
    return response.data;
  },

  detach: async (campaignId: string, activationId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${campaignId}/homebrew/${activationId}`);
    return response.data;
  },

  listAttached: async (campaignId: string): Promise<ApiResponse<TeamHomebrewActivationResponse[]>> => {
    const response = await api.get<ApiResponse<TeamHomebrewActivationResponse[]>>(`/campaigns/${campaignId}/homebrew`);
    return response.data;
  },

  // Pin version
  pinVersion: async (campaignId: string, activationId: string, data: PinHomebrewVersionRequest): Promise<ApiResponse<TeamHomebrewActivationResponse>> => {
    const response = await api.put<ApiResponse<TeamHomebrewActivationResponse>>(`/campaigns/${campaignId}/homebrew/${activationId}/pin`, data);
    return response.data;
  },

  // Override (child package)
  createOverride: async (data: CreateOverrideHomebrewRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>('/homebrew/override', data);
    return response.data;
  },

  // Versions
  getVersions: async (packageId: string): Promise<ApiResponse<{ version: number; createdAt: string; changes?: string[] }[]>> => {
    const response = await api.get<ApiResponse<{ version: number; createdAt: string; changes?: string[] }[]>>(`/homebrew/${packageId}/versions`);
    return response.data;
  },
};
