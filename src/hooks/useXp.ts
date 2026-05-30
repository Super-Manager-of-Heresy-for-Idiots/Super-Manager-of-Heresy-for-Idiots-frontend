import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { xpApi } from '@/api/xp.api';
import type { GrantXpRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useGrantXp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: GrantXpRequest }) =>
      xpApi.grant(campaignId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('XP granted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to grant XP');
    },
  });
}
