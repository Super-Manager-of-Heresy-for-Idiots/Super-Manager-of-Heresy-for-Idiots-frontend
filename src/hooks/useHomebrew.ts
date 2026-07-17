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
  ContentType,
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

/**
 * Существующий контент автора заданного типа, доступный для прикрепления к пакету
 * (браузируемый пикер «существующее»). Обновляется при изменении контента пакета.
 */
export function useAttachableContent(packageId: string | undefined, type: ContentType, enabled: boolean) {
  return useQuery({
    queryKey: ['homebrew-attachable', packageId, type],
    queryFn: async () => {
      const response = await homebrewApi.getAttachableContent(packageId!, type);
      return response.data;
    },
    enabled: !!packageId && enabled,
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
      queryClient.invalidateQueries({ queryKey: ['homebrew-attachable'] });
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

export function useRemoveContent() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, contentItemId }: { packageId: string; contentItemId: string }) =>
      homebrewApi.removeContent(packageId, contentItemId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['homebrew-my'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-attachable'] });
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

export function useReportPackage() {
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, reason }: { packageId: string; reason: string }) =>
      homebrewApi.reportPackage(packageId, reason),
    onSuccess: () => toast.success(t('hk.homebrew.reported')),
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.reportFailed'));
    },
  });
}

export function usePackagePreview(id: string | undefined) {
  return useQuery({
    queryKey: ['homebrew-preview', id],
    queryFn: async () => {
      const response = await homebrewApi.getPackagePreview(id!);
      return response.data;
    },
    enabled: !!id,
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

// === Admin moderation (P2-6) ===

export function useHomebrewReports(params: { status?: string; page?: number; size?: number } = {}) {
  return useQuery({
    queryKey: ['admin-homebrew-reports', params],
    queryFn: async () => {
      const response = await homebrewApi.adminGetReports(params);
      return response.data;
    },
  });
}

export function useRejectHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => homebrewApi.adminRejectPackage(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew'] });
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew-reports'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success(t('hk.homebrew.rejected'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.moderationFailed'));
    },
  });
}

export function useRestoreHomebrew() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewApi.adminRestorePackage(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew'] });
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew-reports'] });
      queryClient.invalidateQueries({ queryKey: ['homebrew-marketplace'] });
      toast.success(t('hk.homebrew.restored'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.moderationFailed'));
    },
  });
}

export function useResolveHomebrewReport() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ reportId, action }: { reportId: string; action: 'DISMISS' | 'RESOLVE' }) =>
      homebrewApi.adminResolveReport(reportId, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-homebrew-reports'] });
      toast.success(t('hk.homebrew.reportResolved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.homebrew.moderationFailed'));
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
