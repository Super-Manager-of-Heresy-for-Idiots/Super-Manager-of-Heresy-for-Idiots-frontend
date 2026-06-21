import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { spellSlotsApi } from '@/api/spellSlots.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError, SpellSlotsResponse } from '@/types';
import { AxiosError } from 'axios';

const slotsKey = (characterId: string) => ['spell-slots', characterId] as const;

export function useSpellSlots(characterId: string, enabled = true) {
  return useQuery({
    queryKey: slotsKey(characterId),
    queryFn: async () => {
      const response = await spellSlotsApi.get(characterId);
      return response.data;
    },
    enabled: enabled && !!characterId,
  });
}

/**
 * Expend / restore mutations for a character's spell slots. The backend returns
 * the full recomputed {@link SpellSlotsResponse} (max is derived, never stored),
 * so each success writes that snapshot straight into the query cache and prefers
 * the backend's localized message for the toast.
 */
export function useSpellSlotActions(characterId: string) {
  const queryClient = useQueryClient();
  const t = useT();

  const writeSnapshot = (data: SpellSlotsResponse | undefined) => {
    if (data) queryClient.setQueryData(slotsKey(characterId), data);
  };

  const expend = useMutation({
    mutationFn: (spellLevel: number) => spellSlotsApi.expend(characterId, spellLevel),
    onSuccess: (res) => {
      writeSnapshot(res.data);
      toast.success(res.message || t('hk.spellSlots.expended'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellSlots.expendFailed'));
    },
  });

  const restoreAll = useMutation({
    mutationFn: () => spellSlotsApi.restoreAll(characterId),
    onSuccess: (res) => {
      writeSnapshot(res.data);
      toast.success(res.message || t('hk.spellSlots.restoredAll'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellSlots.restoreFailed'));
    },
  });

  const restoreHalf = useMutation({
    mutationFn: () => spellSlotsApi.restoreHalf(characterId),
    onSuccess: (res) => {
      writeSnapshot(res.data);
      toast.success(res.message || t('hk.spellSlots.restoredHalf'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellSlots.restoreFailed'));
    },
  });

  return { expend, restoreAll, restoreHalf };
}
