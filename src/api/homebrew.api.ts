import api from './axios';
import type {
  ApiResponse,
  Page,
  HomebrewPackageResponse,
  HomebrewDetailResponse,
  InstalledHomebrewResponse,
  SoftDeleteResponse,
  HardDeleteResponse,
  HomebrewTagResponse,
  CreateHomebrewRequest,
  UpdateHomebrewRequest,
  AddContentRequest,
  HomebrewStatus,
  CreateItemTypeRequest,
  CreateSkillRequest,
  CreateFeatRequest,
  CreateBuffDebuffRequest,
  ContentType,
  AttachableContentResponse,
  HomebrewReportResponse,
} from '@/types';

export interface InstallHomebrewResponse {
  addedAt: string;
  packageVersion: number;
}

export const homebrewApi = {
  // === Author endpoints (GAME_MASTER) ===

  create: async (data: CreateHomebrewRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>('/homebrew', data);
    return response.data;
  },

  getMyPackages: async (params: {
    status?: HomebrewStatus | 'DELETED';
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/homebrew/my', { params });
    return response.data;
  },

  addContent: async (id: string, data: AddContentRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content`, data);
    return response.data;
  },

  getAttachableContent: async (packageId: string, type: ContentType): Promise<ApiResponse<AttachableContentResponse[]>> => {
    const response = await api.get<ApiResponse<AttachableContentResponse[]>>(
      `/homebrew/my/${packageId}/attachable`, { params: { type } },
    );
    return response.data;
  },

  createPackageItemType: async (id: string, data: CreateItemTypeRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content/item-types`, data);
    return response.data;
  },

  createPackageSkill: async (id: string, data: CreateSkillRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content/skills`, data);
    return response.data;
  },

  createPackageFeat: async (id: string, data: CreateFeatRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content/feats`, data);
    return response.data;
  },

  createPackageBuffDebuff: async (id: string, data: CreateBuffDebuffRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content/buffs-debuffs`, data);
    return response.data;
  },

  publish: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/unpublish`);
    return response.data;
  },

  deleteMyPackage: async (id: string): Promise<ApiResponse<SoftDeleteResponse>> => {
    const response = await api.delete<ApiResponse<SoftDeleteResponse>>(`/homebrew/my/${id}`);
    return response.data;
  },

  getMyPackage: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.get<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}`);
    return response.data;
  },

  updateMyPackage: async (id: string, data: UpdateHomebrewRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.put<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}`, data);
    return response.data;
  },

  removeContent: async (packageId: string, contentItemId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/my/${packageId}/content/${contentItemId}`);
    return response.data;
  },

  // === Marketplace endpoints ===

  browseMarketplace: async (params: {
    search?: string;
    tags?: string;
    sort?: 'downloads' | 'newest' | 'rating' | 'oldest';
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/homebrew/marketplace', { params });
    return response.data;
  },

  getMarketplacePackage: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.get<ApiResponse<HomebrewDetailResponse>>(`/homebrew/marketplace/${id}`);
    return response.data;
  },

  installPackage: async (id: string): Promise<ApiResponse<InstallHomebrewResponse>> => {
    const response = await api.post<ApiResponse<InstallHomebrewResponse>>(`/homebrew/marketplace/${id}/install`);
    return response.data;
  },

  // === Installed packages ===

  getInstalledPackages: async (params: { page?: number; size?: number } = {}): Promise<ApiResponse<Page<InstalledHomebrewResponse>>> => {
    const response = await api.get<ApiResponse<Page<InstalledHomebrewResponse>>>('/homebrew/installed', { params });
    return response.data;
  },

  uninstallPackage: async (installId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/installed/${installId}`);
    return response.data;
  },

  // === Ratings ===

  getRatings: async (packageId: string): Promise<ApiResponse<import('@/types').HomebrewRatingResponse>> => {
    const response = await api.get<ApiResponse<import('@/types').HomebrewRatingResponse>>(`/homebrew/marketplace/${packageId}/rating`);
    return response.data;
  },

  rate: async (packageId: string, data: import('@/types').RateHomebrewRequest): Promise<ApiResponse<import('@/types').HomebrewRatingResponse>> => {
    const response = await api.post<ApiResponse<import('@/types').HomebrewRatingResponse>>(`/homebrew/marketplace/${packageId}/rate`, data);
    return response.data;
  },

  // === Moderation (P2-6) ===

  reportPackage: async (packageId: string, reason: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/homebrew/marketplace/${packageId}/report`, { reason });
    return response.data;
  },

  // === Library ===

  getLibrary: async (): Promise<ApiResponse<HomebrewPackageResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewPackageResponse[]>>('/homebrew/library');
    return response.data;
  },

  // === Admin endpoints (ADMIN) ===

  adminGetAllPackages: async (params: {
    status?: HomebrewStatus;
    authorId?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/admin/homebrew', { params });
    return response.data;
  },

  adminHardDelete: async (id: string): Promise<ApiResponse<HardDeleteResponse>> => {
    const response = await api.delete<ApiResponse<HardDeleteResponse>>(`/admin/homebrew/${id}`);
    return response.data;
  },

  adminGetTags: async (): Promise<ApiResponse<HomebrewTagResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewTagResponse[]>>('/admin/homebrew/tags');
    return response.data;
  },

  adminDeleteTag: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/homebrew/tags/${id}`);
    return response.data;
  },

  // === Admin moderation (ADMIN, P2-6) ===

  adminGetReports: async (params: { status?: string; page?: number; size?: number } = {}): Promise<ApiResponse<Page<HomebrewReportResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewReportResponse>>>('/admin/homebrew/reports', { params });
    return response.data;
  },

  adminRejectPackage: async (id: string, reason?: string): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.post<ApiResponse<HomebrewPackageResponse>>(`/admin/homebrew/${id}/reject`, null, { params: reason ? { reason } : undefined });
    return response.data;
  },

  adminRestorePackage: async (id: string): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.post<ApiResponse<HomebrewPackageResponse>>(`/admin/homebrew/${id}/restore`);
    return response.data;
  },

  adminResolveReport: async (reportId: string, action: 'DISMISS' | 'RESOLVE'): Promise<ApiResponse<HomebrewReportResponse>> => {
    const response = await api.post<ApiResponse<HomebrewReportResponse>>(`/admin/homebrew/reports/${reportId}/resolve`, null, { params: { action } });
    return response.data;
  },
};
