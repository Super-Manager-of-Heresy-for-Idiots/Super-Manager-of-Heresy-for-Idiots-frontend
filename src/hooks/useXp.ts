import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { xpApi } from '@/api/xp.api';
import { useT } from '@/i18n/I18nContext';
import type { GrantXpRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useGrantXp() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: GrantXpRequest }) =>
      xpApi.grant(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success(t('hk.xp.granted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.xp.grantFailed'));
    },
  });
}
