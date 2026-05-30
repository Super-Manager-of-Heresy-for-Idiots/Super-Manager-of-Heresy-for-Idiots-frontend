import api from './axios';
import type {
  ApiResponse,
  CampaignResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  SetCampaignStatusRequest,
  JoinCampaignRequest,
  InviteCodeResponse,
  ReassignCharacterRequest,
  StorageContainerResponse,
  CreateStorageContainerRequest,
  AddStorageItemRequest,
  StorageItemResponse,
} from '@/types';

export const campaignsApi = {
  list: async (): Promise<ApiResponse<CampaignResponse[]>> => {
    const response = await api.get<ApiResponse<CampaignResponse[]>>('/campaigns');
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.get<ApiResponse<CampaignResponse>>(`/campaigns/${id}`);
    return response.data;
  },

  create: async (data: CreateCampaignRequest): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.post<ApiResponse<CampaignResponse>>('/campaigns', data);
    return response.data;
  },

  update: async (id: string, data: UpdateCampaignRequest): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.put<ApiResponse<CampaignResponse>>(`/campaigns/${id}`, data);
    return response.data;
  },

  setStatus: async (id: string, data: SetCampaignStatusRequest): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.put<ApiResponse<CampaignResponse>>(`/campaigns/${id}/status`, data);
    return response.data;
  },

  join: async (data: JoinCampaignRequest): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.post<ApiResponse<CampaignResponse>>('/campaigns/join', data);
    return response.data;
  },

  leave: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${id}/leave`);
    return response.data;
  },

  getInviteCode: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.get<ApiResponse<InviteCodeResponse>>(`/campaigns/${id}/invite-code`);
    return response.data;
  },

  regenerateInvite: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.post<ApiResponse<InviteCodeResponse>>(`/campaigns/${id}/regenerate-invite`);
    return response.data;
  },

  kickMember: async (id: string, userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${id}/members/${userId}`);
    return response.data;
  },

  reassignCharacter: async (id: string, charId: string, data: ReassignCharacterRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${id}/characters/${charId}/reassign`, data);
    return response.data;
  },

  // Shared storage
  getStorage: async (id: string): Promise<ApiResponse<StorageContainerResponse[]>> => {
    const response = await api.get<ApiResponse<StorageContainerResponse[]>>(`/campaigns/${id}/storage`);
    return response.data;
  },

  createContainer: async (id: string, data: CreateStorageContainerRequest): Promise<ApiResponse<StorageContainerResponse>> => {
    const response = await api.post<ApiResponse<StorageContainerResponse>>(`/campaigns/${id}/storage`, data);
    return response.data;
  },

  addStorageItem: async (id: string, sid: string, data: AddStorageItemRequest): Promise<ApiResponse<StorageItemResponse>> => {
    const response = await api.post<ApiResponse<StorageItemResponse>>(`/campaigns/${id}/storage/${sid}/items`, data);
    return response.data;
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${id}`);
    return response.data;
  },
};
