import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { resourceTypesApi, type ResourceTypeAdmin, type ResourceTypeRequest } from '@/api/resourceTypes.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError } from '@/types';

const KEY = ['resource-types'] as const;

export function useResourceTypes() {
  return useQuery<ResourceTypeAdmin[]>({
    queryKey: KEY,
    queryFn: async () => (await resourceTypesApi.list()).data ?? [],
  });
}

function err(error: AxiosError<ApiError>, fallback: string): string {
  return error.response?.data?.message || fallback;
}

export function useCreateResourceType() {
  const t = useT();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ResourceTypeRequest) => resourceTypesApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('adm.resourceTypes.created'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(err(e, t('adm.resourceTypes.saveFailed'))),
  });
}

export function useUpdateResourceType() {
  const t = useT();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ResourceTypeRequest }) => resourceTypesApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('adm.resourceTypes.saved'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(err(e, t('adm.resourceTypes.saveFailed'))),
  });
}

export function useDeleteResourceType() {
  const t = useT();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => resourceTypesApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      toast.success(t('adm.resourceTypes.deleted'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(err(e, t('adm.resourceTypes.deleteFailed'))),
  });
}
