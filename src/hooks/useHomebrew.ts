import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { homebrewApi } from '@/api/homebrew.api';
import type {
  ApiError,
  CreateHomebrewRequest,
  UpdateHomebrewRequest,
  AddContentRequest,
  HomebrewStatus,
  CreateRichCharacterClassRequest,
} from '@/types';
import { AxiosError } from 'axios';

// === Author hooks (GAME_MASTER) ===

export function useMyPackages(params: { status?: HomebrewStatus | 'DELETED'; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['homebrew-my', params],
    queryFn: async () => {
      const response = await homebrewApi.getMyPackages(params);
      return response.data;
    },
  });
}

export function useMyPackage(id: string | undefined) {
  return useQuery({
    queryKey: ['homebrew-my', id],
    queryFn: async () => {
      const response = await homebrewApi.getMyPackage(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateHomebrewRequest) => homebrewApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success('Doctrine created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create doctrine');
    },
  });
}

export function useUpdateHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHomebrewRequest }) =>
      homebrewApi.updateMyPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success('Doctrine updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update doctrine');
    },
  });
}

export function useAddContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: AddContentRequest }) =>
      homebrewApi.addContent(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success('Content added!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'This content is already in the package or the package is not in DRAFT'
        : error.response?.data?.message || 'Failed to add content';
      toast.error(message);
    },
  });
}

export function useCreateRichHomebrewClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: CreateRichCharacterClassRequest }) =>
      homebrewApi.createRichPackageCharacterClass(packageId, data),
    onSuccess: (response, variables) => {
      if (response.data?.packageDetail) {
        queryClient.setQueryData(['homebrew-my', variables.packageId], response.data.packageDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', variables.packageId] });
      toast.success('Rich class created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create rich class');
    },
  });
}

export function useImportRichHomebrewClassJson() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: CreateRichCharacterClassRequest }) =>
      homebrewApi.importRichPackageCharacterClassJson(packageId, data),
    onSuccess: (response, variables) => {
      if (response.data?.packageDetail) {
        queryClient.setQueryData(['homebrew-my', variables.packageId], response.data.packageDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', variables.packageId] });
      toast.success('Rich class imported!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to import rich class');
    },
  });
}

export function useUpdateRichHomebrewClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      packageId,
      classId,
      data,
    }: {
      packageId: string;
      classId: string;
      data: CreateRichCharacterClassRequest;
    }) => homebrewApi.updateRichPackageCharacterClass(packageId, classId, data),
    onSuccess: (response, variables) => {
      if (response.data?.packageDetail) {
        queryClient.setQueryData(['homebrew-my', variables.packageId], response.data.packageDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', variables.packageId] });
      toast.success('Rich class updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update rich class');
    },
  });
}

export function useRemoveContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ packageId, contentItemId }: { packageId: string; contentItemId: string }) =>
      homebrewApi.removeContent(packageId, contentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success('Content removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove content');
    },
  });
}

export function usePublishHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success('Doctrine sealed and published!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 422
        ? 'Cannot publish: package must have at least one content item and a title'
        : status === 409
          ? 'Cannot publish from current status'
          : error.response?.data?.message || 'Failed to publish';
      toast.error(message);
    },
  });
}

export function useUnpublishHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success('Doctrine withheld from marketplace');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to unpublish');
    },
  });
}

export function useDeleteHomebrew() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.deleteMyPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success('Doctrine redacted');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete doctrine');
    },
  });
}

// === Marketplace hooks (GAME_MASTER) ===

export function useMarketplace(params: {
  search?: string;
  tags?: string;
  sort?: 'downloads' | 'newest' | 'oldest' | 'rating';
  page?: number;
  size?: number;
} = {}) {
  return useQuery({
    queryKey: ['homebrew-marketplace', params],
    queryFn: async () => {
      const response = await homebrewApi.browseMarketplace(params);
      return response.data;
    },
  });
}

export function useMarketplacePackage(id: string | undefined) {
  return useQuery({
    queryKey: ['homebrew-marketplace', id],
    queryFn: async () => {
      const response = await homebrewApi.getMarketplacePackage(id!);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useInstallPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.installPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-installed'] });
      toast.success('Doctrine instated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Already instated'
        : error.response?.data?.message || 'Failed to install';
      toast.error(message);
    },
  });
}

// === Installed hooks (GAME_MASTER) ===

export function useInstalledPackages(params: { page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['homebrew-installed', params],
    queryFn: async () => {
      const response = await homebrewApi.getInstalledPackages(params);
      return response.data;
    },
  });
}

export function useUninstallPackage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (installationId: string) => homebrewApi.uninstallPackage(installationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-installed'] });
      toast.success('Doctrine revoked');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to uninstall');
    },
  });
}

// === Admin hooks ===

export function useAdminHomebrewPackages(params: {
  status?: HomebrewStatus;
  authorId?: string;
  page?: number;
  size?: number;
} = {}) {
  return useQuery({
    queryKey: ['admin-homebrew', params],
    queryFn: async () => {
      const response = await homebrewApi.adminGetAllPackages(params);
      return response.data;
    },
  });
}

export function useAdminHardDelete() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.adminHardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew'] });
      toast.success('Package permanently deleted');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete package');
    },
  });
}

export function useAdminTags() {
  return useQuery({
    queryKey: ['admin-homebrew-tags'],
    queryFn: async () => {
      const response = await homebrewApi.adminGetTags();
      return response.data;
    },
  });
}

export function useAdminDeleteTag() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.adminDeleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew-tags'] });
      toast.success('Tag deleted');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Cannot delete: tag is in use'
        : error.response?.data?.message || 'Failed to delete tag';
      toast.error(message);
    },
  });
}
