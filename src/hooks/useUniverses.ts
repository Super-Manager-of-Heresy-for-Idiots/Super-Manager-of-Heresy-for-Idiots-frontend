import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { universesApi } from '@/api/universes.api';
import { useT } from '@/i18n/I18nContext';
import type { CreateUniverseRequest, ApiError } from '@/types';

export function useUniverses() {
  return useQuery({
    queryKey: ['universes'],
    queryFn: async () => {
      const response = await universesApi.list();
      return response.data ?? [];
    },
  });
}

export function useCreateUniverse() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (data: CreateUniverseRequest) => universesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['universes'] });
      toast.success(t('hk.universe.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.universe.createFailed'));
    },
  });
}
