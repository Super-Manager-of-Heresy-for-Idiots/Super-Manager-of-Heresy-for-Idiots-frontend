import api from './axios';
import type {
  ApiResponse,
  CampaignResponse,
  CampaignDetailResponse,
  CreateCampaignRequest,
  UpdateCampaignRequest,
  SetCampaignStatusRequest,
  JoinCampaignRequest,
  InviteCodeResponse,
  KickMemberRequest,
  ReassignCharacterRequest,
  CharacterResponse,
  SharedStorageResponse,
  CreateStorageContainerRequest,
  ItemInstanceResponse,
  Page,
} from '@/types';

export const campaignsApi = {
  list: async (params?: { page?: number; size?: number; sort?: string }): Promise<ApiResponse<Page<CampaignResponse>>> => {
    const response = await api.get<ApiResponse<Page<CampaignResponse>>>('/campaigns', { params });
    return response.data;
  },

  getById: async (id: string): Promise<ApiResponse<CampaignDetailResponse>> => {
    const response = await api.get<ApiResponse<CampaignDetailResponse>>(`/campaigns/${id}`);
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

  delete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${id}`);
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

  kick: async (id: string, data: KickMemberRequest): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/campaigns/${id}/kick`, data);
    return response.data;
  },

  setStatus: async (id: string, data: SetCampaignStatusRequest): Promise<ApiResponse<CampaignResponse>> => {
    const response = await api.put<ApiResponse<CampaignResponse>>(`/campaigns/${id}/status`, data);
    return response.data;
  },

  getInviteCode: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.get<ApiResponse<InviteCodeResponse>>(`/campaigns/${id}/invite-code`);
    return response.data;
  },

  regenerateInviteCode: async (id: string): Promise<ApiResponse<InviteCodeResponse>> => {
    const response = await api.post<ApiResponse<InviteCodeResponse>>(`/campaigns/${id}/invite-code/regenerate`);
    return response.data;
  },

  reassignCharacter: async (id: string, characterId: string, data: ReassignCharacterRequest): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(`/campaigns/${id}/characters/${characterId}/reassign`, data);
    return response.data;
  },

  // Shared storage
  getStorage: async (id: string): Promise<ApiResponse<SharedStorageResponse[]>> => {
    const response = await api.get<ApiResponse<SharedStorageResponse[]>>(`/campaigns/${id}/shared-storage`);
    return response.data;
  },

  getStorageById: async (id: string, storageId: string): Promise<ApiResponse<SharedStorageResponse>> => {
    const response = await api.get<ApiResponse<SharedStorageResponse>>(`/campaigns/${id}/shared-storage/${storageId}`);
    return response.data;
  },

  createStorage: async (id: string, data: CreateStorageContainerRequest): Promise<ApiResponse<SharedStorageResponse>> => {
    const response = await api.post<ApiResponse<SharedStorageResponse>>(`/campaigns/${id}/shared-storage`, data);
    return response.data;
  },

  deleteStorage: async (id: string, storageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/campaigns/${id}/shared-storage/${storageId}`);
    return response.data;
  },

  depositItem: async (id: string, storageId: string, instanceId: string): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(`/campaigns/${id}/shared-storage/${storageId}/items/${instanceId}/deposit`);
    return response.data;
  },

  takeItem: async (id: string, storageId: string, instanceId: string, characterId: string): Promise<ApiResponse<ItemInstanceResponse>> => {
    const response = await api.post<ApiResponse<ItemInstanceResponse>>(
      `/campaigns/${id}/shared-storage/${storageId}/items/${instanceId}/take/${characterId}`,
    );
    return response.data;
  },
};
