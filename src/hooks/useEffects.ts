import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { effectsApi } from '@/api/effects.api';
import { useT } from '@/i18n/I18nContext';
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
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId: string; characterId: string; data: ApplyEffectRequest }) =>
      effectsApi.apply(campaignId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.effect.applied'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.effect.applyFailed');
      toast.error(message);
    },
  });
}

export function useRemoveEffect() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, effectId }: { campaignId: string; characterId: string; effectId: string }) =>
      effectsApi.remove(campaignId, characterId, effectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.effect.removed'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.effect.removeFailed');
      toast.error(message);
    },
  });
}
