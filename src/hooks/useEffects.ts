import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { effectsApi } from '@/api/effects.api';
import type { ApplyEffectRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useCharacterEffects(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'effects'],
    queryFn: async () => {
      const response = await effectsApi.list(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useApplyEffect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId: string; characterId: string; data: ApplyEffectRequest }) =>
      effectsApi.apply(campaignId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Effect applied!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to apply effect';
      toast.error(message);
    },
  });
}

export function useRemoveEffect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, effectId }: { campaignId: string; characterId: string; effectId: string }) =>
      effectsApi.remove(campaignId, characterId, effectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Effect removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to remove effect';
      toast.error(message);
    },
  });
}
