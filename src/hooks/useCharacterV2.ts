import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersV2Api } from '@/api/characters-v2.api';
import type {
  CreateCharacterInCampaignRequest,
  UpdateHpRequest,
  ModifyWalletRequest,
  ModifyResourceRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignCharacters(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters'],
    queryFn: async () => {
      const response = await charactersV2Api.listInCampaign(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCharacterV2(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId],
    queryFn: async () => {
      const response = await charactersV2Api.getById(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useCreateCharacterInCampaign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateCharacterInCampaignRequest }) =>
      charactersV2Api.createInCampaign(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success('Character created successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to create character';
      toast.error(message);
    },
  });
}

export function useUpdateHp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, id, data }: { campaignId?: string; characterId?: string; id?: string; data: UpdateHpRequest }) => {
      const cId = characterId || id || '';
      const campId = campaignId || '_';
      return charactersV2Api.modifyHp(campId, cId, data);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      queryClient.invalidateQueries({ queryKey: ['characters', cId] });
      toast.success('HP updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update HP';
      toast.error(message);
    },
  });
}

export function useCharacterWallet(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'wallet'],
    queryFn: async () => {
      const response = await charactersV2Api.getWallet(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useModifyWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, id, currencyTypeId, data }: {
      campaignId?: string; characterId?: string; id?: string;
      currencyTypeId?: string; data: ModifyWalletRequest;
    }) => {
      const cId = characterId || id || '';
      const campId = campaignId || '_';
      const finalData: ModifyWalletRequest = { ...data };
      if (currencyTypeId && !finalData.currencyTypeId) finalData.currencyTypeId = currencyTypeId;
      return charactersV2Api.modifyWallet(campId, cId, finalData);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId, 'wallet'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      toast.success('Wallet updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update wallet';
      toast.error(message);
    },
  });
}

export function useCharacterResources(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'resources'],
    queryFn: async () => {
      const response = await charactersV2Api.getResources(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useModifyResource() {
  const queryClient = useQueryClient();

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
      return charactersV2Api.modifyResource(campId, cId, finalData);
    },
    onSuccess: (_, variables) => {
      const cId = variables.characterId || variables.id || '';
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId, 'resources'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', cId] });
      }
      toast.success('Resource updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update resource';
      toast.error(message);
    },
  });
}

export function useAbilityCheck() {
  return useMutation({
    mutationFn: ({ campaignId, characterId, statId }: { campaignId: string; characterId: string; statId: string }) =>
      charactersV2Api.abilityCheck(campaignId, characterId, statId),
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to perform ability check';
      toast.error(message);
    },
  });
}

// Aliases for backward-compat
export const useUpdateWallet = useModifyWallet;
export const useUpdateResource = useModifyResource;
