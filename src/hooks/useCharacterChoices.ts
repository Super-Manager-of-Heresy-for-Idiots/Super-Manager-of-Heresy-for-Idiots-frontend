import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { characterChoicesApi, type FeatureChoiceGroup } from '@/api/characterChoices.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError } from '@/types';

const choicesKey = (characterId: string) => ['feature-choices', characterId] as const;

export function useCharacterChoices(characterId: string | undefined, enabled = true) {
  return useQuery<FeatureChoiceGroup[]>({
    queryKey: choicesKey(characterId ?? ''),
    queryFn: async () => (await characterChoicesApi.list(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

function useChoicesInvalidator(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: choicesKey(characterId) });
    queryClient.invalidateQueries({ queryKey: ['capability-profile', characterId] });
    // choices can grant skills → the character sheet must refresh
    queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId] });
  };
}

export function useChooseFeature(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useChoicesInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ groupId, optionType, targetEntityId }: { groupId: string; optionType: string; targetEntityId?: string }) =>
      characterChoicesApi.choose(characterId, groupId, optionType, targetEntityId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.choices.saved'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.choices.saveFailed')),
  });
}

export function useRemoveChoice(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useChoicesInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (choiceId: string) => characterChoicesApi.unchoose(characterId, choiceId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.choices.removed'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.choices.removeFailed')),
  });
}
