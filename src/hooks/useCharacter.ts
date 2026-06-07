import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersApi } from '@/api/characters.api';
import { useT } from '@/i18n/I18nContext';
import type {
  CreateCharacterInCampaignRequest,
  UpdateCharacterRequest,
  UpdateHpRequest,
  UpdateStatRequest,
  ModifyWalletRequest,
  ModifyResourceRequest,
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
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      toast.success(t('hk.character.walletUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.walletUpdateFailed');
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

export function useModifyResource() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, id, resourceTypeId, data }: {
      campaignId?: string; characterId?: string; id?: string;
      resourceTypeId?: string; data: ModifyResourceRequest | { value: number };
    }) => {
      const cId = characterId || id || '';
      const campId = campaignId || '_';
      const finalData: ModifyResourceRequest = {
        resourceTypeId: resourceTypeId || (data as ModifyResourceRequest).resourceTypeId || '',
        currentValue: ('value' in data) ? (data as { value: number }).value : (data as ModifyResourceRequest).currentValue,
      };
      return charactersApi.modifyResource(campId, cId, finalData);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId, 'resources'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      toast.success(t('hk.character.resourceUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.character.resourceUpdateFailed');
      toast.error(message);
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
export const useUpdateResource = useModifyResource;
