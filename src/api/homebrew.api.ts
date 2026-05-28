import api from './axios';
import type {
  ApiResponse,
  Page,
  HomebrewPackageResponse,
  HomebrewDetailResponse,
  InstalledHomebrewResponse,
  InstallResponse,
  SoftDeleteResponse,
  HardDeleteResponse,
  HomebrewTagResponse,
  CreateHomebrewRequest,
  UpdateHomebrewRequest,
  AddContentRequest,
  HomebrewStatus,
} from '@/types';

// === Author endpoints (GAME_MASTER) ===

export const homebrewApi = {
  // Create a new DRAFT package
  create: async (data: CreateHomebrewRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>('/homebrew', data);
    return response.data;
  },

  // List my packages (paginated, optional status filter)
  getMyPackages: async (params: {
    status?: HomebrewStatus | 'DELETED';
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/homebrew/my', { params });
    return response.data;
  },

  // Get my package details
  getMyPackage: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.get<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}`);
    return response.data;
  },

  // Update package (DRAFT only)
  updateMyPackage: async (id: string, data: UpdateHomebrewRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.put<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}`, data);
    return response.data;
  },

  // Add content to package (DRAFT only)
  addContent: async (id: string, data: AddContentRequest): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/content`, data);
    return response.data;
  },

  // Remove content from package (DRAFT only)
  removeContent: async (packageId: string, contentItemId: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.delete<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${packageId}/content/${contentItemId}`);
    return response.data;
  },

  // Publish package (DRAFT | UNPUBLISHED -> PUBLISHED)
  publish: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/publish`);
    return response.data;
  },

  // Unpublish package (PUBLISHED -> UNPUBLISHED)
  unpublish: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.post<ApiResponse<HomebrewDetailResponse>>(`/homebrew/my/${id}/unpublish`);
    return response.data;
  },

  // Soft delete package
  deleteMyPackage: async (id: string): Promise<ApiResponse<SoftDeleteResponse>> => {
    const response = await api.delete<ApiResponse<SoftDeleteResponse>>(`/homebrew/my/${id}`);
    return response.data;
  },

  // === Marketplace endpoints (GAME_MASTER) ===

  // Browse marketplace
  browseMarketplace: async (params: {
    search?: string;
    tags?: string;
    sort?: 'downloads' | 'newest' | 'oldest';
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/homebrew/marketplace', { params });
    return response.data;
  },

  // Get marketplace package details
  getMarketplacePackage: async (id: string): Promise<ApiResponse<HomebrewDetailResponse>> => {
    const response = await api.get<ApiResponse<HomebrewDetailResponse>>(`/homebrew/marketplace/${id}`);
    return response.data;
  },

  // Install package
  installPackage: async (id: string): Promise<ApiResponse<InstallResponse>> => {
    const response = await api.post<ApiResponse<InstallResponse>>(`/homebrew/marketplace/${id}/install`);
    return response.data;
  },

  // === Installed packages (GAME_MASTER) ===

  // List installed packages
  getInstalledPackages: async (params: {
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<InstalledHomebrewResponse>>> => {
    const response = await api.get<ApiResponse<Page<InstalledHomebrewResponse>>>('/homebrew/installed', { params });
    return response.data;
  },

  // Uninstall package
  uninstallPackage: async (installationId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/homebrew/installed/${installationId}`);
    return response.data;
  },

  // === Admin endpoints (ADMIN) ===

  // List all packages (admin)
  adminGetAllPackages: async (params: {
    status?: HomebrewStatus;
    authorId?: string;
    page?: number;
    size?: number;
  } = {}): Promise<ApiResponse<Page<HomebrewPackageResponse>>> => {
    const response = await api.get<ApiResponse<Page<HomebrewPackageResponse>>>('/admin/homebrew', { params });
    return response.data;
  },

  // Hard delete package (admin)
  adminHardDelete: async (id: string): Promise<ApiResponse<HardDeleteResponse>> => {
    const response = await api.delete<ApiResponse<HardDeleteResponse>>(`/admin/homebrew/${id}`);
    return response.data;
  },

  // List tags with usage counts (admin)
  adminGetTags: async (): Promise<ApiResponse<HomebrewTagResponse[]>> => {
    const response = await api.get<ApiResponse<HomebrewTagResponse[]>>('/admin/homebrew/tags');
    return response.data;
  },

  // Delete tag (admin)
  adminDeleteTag: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/homebrew/tags/${id}`);
    return response.data;
  },
};
