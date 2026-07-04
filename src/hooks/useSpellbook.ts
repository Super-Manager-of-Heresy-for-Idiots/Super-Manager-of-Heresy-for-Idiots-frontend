import { useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { spellbookApi } from '@/api/spellbook.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError } from '@/types';

/** Invalidate the queries affected by a spellbook change (the character sheet + its capability profile). */
function useSpellbookInvalidator(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId] });
    queryClient.invalidateQueries({ queryKey: ['capability-profile', characterId] });
  };
}

export function useLearnSpell(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useSpellbookInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (spellId: string) => spellbookApi.learn(characterId, spellId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.spellbook.learned'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellbook.learnFailed'));
    },
  });
}

export function useForgetSpell(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useSpellbookInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (spellId: string) => spellbookApi.forget(characterId, spellId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.spellbook.forgotten'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellbook.forgetFailed'));
    },
  });
}
