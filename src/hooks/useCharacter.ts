import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersApi } from '@/api/characters.api';
import { useT, useI18n } from '@/i18n/I18nContext';
import type {
  CreateCharacterInCampaignRequest,
  UpdateCharacterRequest,
  UpdateHpRequest,
  UpdateStatRequest,
  ModifyWalletRequest,
  ResourceResponse,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters'],
    queryFn: async () => {
      const response = await charactersApi.listInCampaign(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCharacter(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId],
    queryFn: async () => {
      const response = await charactersApi.getById(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useCreateCharacterInCampaign() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateCharacterInCampaignRequest }) =>
      charactersApi.createInCampaign(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success(t('hk.character.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.createFailed');
      toast.error(message);
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      data,
    }: {
      campaignId: string;
      characterId: string;
      data: UpdateCharacterRequest;
    }) => charactersApi.update(campaignId, characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.character.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.updateFailed');
      toast.error(message);
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId }: { campaignId: string; characterId: string }) =>
      charactersApi.delete(campaignId, characterId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      queryClient.removeQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.character.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.deleteFailed');
      toast.error(message);
    },
  });
}

export function useCharacterStats(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'stats'],
    queryFn: async () => {
      const response = await charactersApi.getStats(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useUpdateCharacterStat() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      statId,
      data,
    }: {
      campaignId: string;
      characterId: string;
      statId: string;
      data: UpdateStatRequest;
    }) => charactersApi.updateStat(campaignId, characterId, statId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.character.statUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.statUpdateFailed');
      toast.error(message);
    },
  });
}

export function useUpdateHp() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, id, data }: { campaignId?: string; characterId?: string; id?: string; data: UpdateHpRequest }) => {
      const cId = characterId || id || '';
      const campId = campaignId || '_';
      return charactersApi.modifyHp(campId, cId, data);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      queryClient.invalidateQueries({ queryKey: ['characters', cId] });
      toast.success(t('hk.character.hpUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.hpUpdateFailed');
      toast.error(message);
    },
  });
}

export function useCharacterWallet(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'wallet'],
    queryFn: async () => {
      const response = await charactersApi.getWallet(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

/** Campaign currency reference (id = currencyTypeId), used by the GM balance manager. */
export function useCampaignCurrencies(campaignId: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['campaigns', campaignId, 'reference', 'currencies', lang],
    queryFn: async () => {
      const response = await charactersApi.getCampaignCurrencies(campaignId);
      return response.data ?? [];
    },
    enabled: !!campaignId,
  });
}

export function useModifyWallet() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, id, currencyTypeId, data }: {
      campaignId?: string; characterId?: string; id?: string;
      currencyTypeId?: string; data: ModifyWalletRequest;
    }) => {
      const cId = characterId || id || '';
      const campId = campaignId || '_';
      const finalData: ModifyWalletRequest = { ...data };
      if (currencyTypeId && !finalData.currencyTypeId) finalData.currencyTypeId = currencyTypeId;
      return charactersApi.modifyWallet(campId, cId, finalData);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId, 'wallet'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId, 'wallet', 'history'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      toast.success(t('hk.character.walletUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const raw = error.response?.data?.message;
      // Backend returns "Insufficient funds for this operation" — surface a localized toast.
      const message = raw
        ? (/insufficient funds/i.test(raw) ? t('camp.wallet.form.insufficient') : raw)
        : t('hk.character.walletUpdateFailed');
      toast.error(message);
    },
  });
}

/**
 * Wallet transaction journal. The backend does not implement this endpoint yet,
 * so a `404`/`501` is treated as "feature not available" and resolves to `null`
 * (the journal section is hidden) instead of surfacing an error.
 */
export function useWalletHistory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'wallet', 'history'],
    queryFn: async () => {
      try {
        const response = await charactersApi.getWalletHistory(campaignId, characterId);
        return response.data ?? null;
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 501) return null;
        throw err;
      }
    },
    enabled: !!campaignId && !!characterId,
    retry: false,
  });
}

/**
 * Paginated wallet journal for the GM balance manager. Keeps previous page data
 * while the next page loads, and resolves a missing endpoint (404/501) to `null`.
 */
export function useWalletHistoryPaged(campaignId: string, characterId: string, page: number, size = 20) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'wallet', 'history', page, size],
    queryFn: async () => {
      try {
        const response = await charactersApi.getWalletHistory(campaignId, characterId, page, size);
        return response.data ?? null;
      } catch (err) {
        const status = (err as AxiosError)?.response?.status;
        if (status === 404 || status === 501) return null;
        throw err;
      }
    },
    enabled: !!campaignId && !!characterId,
    retry: false,
    placeholderData: (prev) => prev,
  });
}

export function useCharacterResources(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'resources'],
    queryFn: async () => {
      const response = await charactersApi.getResources(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

interface ModifyResourceVars {
  campaignId: string;
  characterId: string;
  resourceId: string;
  delta: number;
}

/**
 * Spend (`delta < 0`) or restore (`delta > 0`) a character resource.
 * Applies an optimistic update to the cached resource list and rolls back on error.
 */
export function useModifyResource() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, resourceId, delta }: ModifyResourceVars) =>
      charactersApi.modifyResource(campaignId, characterId, { resourceId, delta }),
    onMutate: async ({ campaignId, characterId, resourceId, delta }) => {
      const key = ['campaigns', campaignId, 'characters', characterId, 'resources'];
      await queryClient.cancelQueries({ queryKey: key });
      const previous = queryClient.getQueryData<ResourceResponse[]>(key);
      queryClient.setQueryData<ResourceResponse[]>(key, (old) =>
        old?.map((r) =>
          r.id === resourceId
            ? { ...r, currentValue: Math.max(0, Math.min(r.maxValue, r.currentValue + delta)) }
            : r,
        ),
      );
      return { key, previous };
    },
    onError: (error: AxiosError<ApiError>, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(context.key, context.previous);
      }
      const message = error.response?.data?.message || t('hk.character.resourceUpdateFailed');
      toast.error(message);
    },
    onSettled: (_data, _error, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'resources'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId],
      });
    },
  });
}

interface RestVars {
  campaignId: string;
  characterId: string;
  type: 'long' | 'short';
}

/**
 * One orchestrated rest (long/short): restores legacy resources, feature resources, spell slots and
 * HP in a single backend transaction, then refreshes everything the sheet shows so the player does
 * not have to trigger (and reconcile) several separate rest calls.
 */
export function useRest() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, type }: RestVars) =>
      charactersApi.rest(campaignId, characterId, type),
    onSuccess: (_data, { type }) => {
      toast.success(type === 'long' ? t('hk.character.restLongDone') : t('hk.character.restShortDone'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.character.restFailed'));
    },
    onSettled: (_data, _error, { campaignId, characterId }) => {
      // Broad refresh: character (HP), resources, effects and stats all sit under this prefix.
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId] });
      queryClient.invalidateQueries({ queryKey: ['spell-slots', characterId] });
      queryClient.invalidateQueries({ queryKey: ['feature-resources', characterId] });
      queryClient.invalidateQueries({ queryKey: ['feature-effects', characterId] });
      queryClient.invalidateQueries({ queryKey: ['feature-actions', characterId] });
      queryClient.invalidateQueries({ queryKey: ['capability-profile', characterId] });
    },
  });
}

export function useAbilityCheck() {
  const t = useT();
  return useMutation({
    mutationFn: ({ campaignId, characterId, statId }: { campaignId: string; characterId: string; statId: string }) =>
      charactersApi.abilityCheck(campaignId, characterId, statId),
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.abilityCheckFailed');
      toast.error(message);
    },
  });
}

// Aliases for backward-compat
export const useUpdateWallet = useModifyWallet;
