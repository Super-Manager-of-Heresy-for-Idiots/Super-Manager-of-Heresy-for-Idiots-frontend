import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { homebrewApi } from '@/api/homebrew.api';
import { useT } from '@/i18n/I18nContext';
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
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateHomebrewRequest) => homebrewApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success(t('hk.homebrew.doctrineCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.doctrineCreateFailed'));
    },
  });
}

export function useUpdateHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHomebrewRequest }) =>
      homebrewApi.updateMyPackage(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success(t('hk.homebrew.doctrineUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.doctrineUpdateFailed'));
    },
  });
}

export function useAddContent() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: AddContentRequest }) =>
      homebrewApi.addContent(packageId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success(t('hk.homebrew.contentAdded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.homebrew.contentAddConflict')
        : error.response?.data?.message || t('hk.homebrew.contentAddFailed');
      toast.error(message);
    },
  });
}

export function useCreateRichHomebrewClass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: CreateRichCharacterClassRequest }) =>
      homebrewApi.createRichPackageCharacterClass(packageId, data),
    onSuccess: (response, variables) => {
      if (response.data?.packageDetail) {
        queryClient.setQueryData(['homebrew-my', variables.packageId], response.data.packageDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', variables.packageId] });
      toast.success(t('hk.homebrew.richClassCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.richClassCreateFailed'));
    },
  });
}

export function useImportRichHomebrewClassJson() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: CreateRichCharacterClassRequest }) =>
      homebrewApi.importRichPackageCharacterClassJson(packageId, data),
    onSuccess: (response, variables) => {
      if (response.data?.packageDetail) {
        queryClient.setQueryData(['homebrew-my', variables.packageId], response.data.packageDetail);
      }
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-my', variables.packageId] });
      toast.success(t('hk.homebrew.richClassImported'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.richClassImportFailed'));
    },
  });
}

export function useUpdateRichHomebrewClass() {
  const queryClient = useQueryClient();
  const t = useT();
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
      toast.success(t('hk.homebrew.richClassUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.richClassUpdateFailed'));
    },
  });
}

export function useRemoveContent() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, contentItemId }: { packageId: string; contentItemId: string }) =>
      homebrewApi.removeContent(packageId, contentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      toast.success(t('hk.homebrew.contentRemoved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.contentRemoveFailed'));
    },
  });
}

export function usePublishHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.publish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success(t('hk.homebrew.published'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 422
        ? t('hk.homebrew.publishUnprocessable')
        : status === 409
          ? t('hk.homebrew.publishConflict')
          : error.response?.data?.message || t('hk.homebrew.publishFailed');
      toast.error(message);
    },
  });
}

export function useUnpublishHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.unpublish(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success(t('hk.homebrew.unpublished'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.unpublishFailed'));
    },
  });
}

export function useDeleteHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.deleteMyPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success(t('hk.homebrew.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.deleteFailed'));
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
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.installPackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-installed'] });
      toast.success(t('hk.homebrew.installed'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.homebrew.installConflict')
        : error.response?.data?.message || t('hk.homebrew.installFailed');
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
  const t = useT();
  return useMutation({
    mutationFn: (installationId: string) => homebrewApi.uninstallPackage(installationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-installed'] });
      toast.success(t('hk.homebrew.uninstalled'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.uninstallFailed'));
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
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.adminHardDelete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew'] });
      toast.success(t('hk.homebrew.packageHardDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.packageDeleteFailed'));
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
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.adminDeleteTag(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew-tags'] });
      toast.success(t('hk.homebrew.tagDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.homebrew.tagDeleteConflict')
        : error.response?.data?.message || t('hk.homebrew.tagDeleteFailed');
      toast.error(message);
    },
  });
}
