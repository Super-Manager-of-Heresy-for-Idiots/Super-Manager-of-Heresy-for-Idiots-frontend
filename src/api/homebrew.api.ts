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
} from '@/types';

export const homebrewApi = {
  // === Author endpoints (GAME_MASTER) ===

  create: async (data: CreateHomebrewRequest): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.post<ApiResponse<HomebrewPackageResponse>>('/homebrew', data);
    return response.data;
  },

  getMyPackages: async (params: {
    status?: HomebrewStatus | 'DELETED';
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/homebrew/mine', { params });
    return response.data;
  },

  getPackageDetail: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.get<ApiResponse<HomebrewDetailResponse>>(`/homebrew/${id}`);
    return response.data;
  },

  updatePackage: async (id: string, data: UpdateHomebrewRequest): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.put<ApiResponse<HomebrewPackageResponse>>(`/homebrew/${id}`, data);
    return response.data;
  },

  addContent: async (id: string, data: AddContentRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/${id}/content`, data);
    return response.data;
  },

  publish: async (id: string): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.post<ApiResponse<HomebrewPackageResponse>>(`/homebrew/${id}/publish`);
    return response.data;
  },

  unpublish: async (id: string): Promise<ApiResponse<HomebrewPackageResponse>> => {
    const response = await api.post<ApiResponse<HomebrewPackageResponse>>(`/homebrew/${id}/unpublish`);
    return response.data;
  },

  deletePackage: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/${id}`);
    return response.data;
  },

  // === Marketplace endpoints ===

  browseMarketplace: async (params: {
    search?: string;
    tags?: string;
    sort?: 'downloads' | 'newest' | 'rating';
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

  installPackage: async (id: string): Promise<ApiResponse<InstalledHomebrewResponse>> => {
    const response = await api.post<ApiResponse<InstalledHomebrewResponse>>(`/homebrew/marketplace/${id}/install`);
    return response.data;
  },

  // === Installed packages ===

  getInstalledPackages: async (): Promise<ApiResponse<InstalledHomebrewResponse[]>> => {
    const response = await api.get<ApiResponse<InstalledHomebrewResponse[]>>('/homebrew/installed');
    return response.data;
  },

  uninstallPackage: async (installId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/installed/${installId}`);
    return response.data;
  },

  // === Ratings ===

  getRatings: async (packageId: string): Promise<ApiResponse<import('@/types').HomebrewRatingResponse>> => {
    const response = await api.get<ApiResponse<import('@/types').HomebrewRatingResponse>>(`/homebrew/ratings/${packageId}`);
    return response.data;
  },

  rate: async (packageId: string, data: import('@/types').RateHomebrewRequest): Promise<ApiResponse<import('@/types').HomebrewRatingResponse>> => {
    const response = await api.post<ApiResponse<import('@/types').HomebrewRatingResponse>>(`/homebrew/ratings/${packageId}`, data);
    return response.data;
  },

  // === Library ===

  getLibrary: async (): Promise<ApiResponse<HomebrewPackageResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewPackageResponse[]>>('/homebrew/library');
    return response.data;
  },

  addToLibrary: async (packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/homebrew/library/${packageId}`);
    return response.data;
  },

  removeFromLibrary: async (packageId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/homebrew/library/${packageId}`);
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

  adminHardDelete: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/homebrew/${id}`);
    return response.data;
  },

  adminGetTags: async (): Promise<ApiResponse<HomebrewTagResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewTagResponse[]>>('/admin/homebrew/tags');
    return response.data;
  },
};
