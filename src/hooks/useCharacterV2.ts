import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersV2Api } from '@/api/characters-v2.api';
import type {
  CreateCharacterInCampaignRequest,
  SetCharacterStatusRequest,
  UpdateHpRequest,
  UpdateWalletRequest,
  UpdateResourceRequest,
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

export function useCharacterV2(id: string) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: async () => {
      const response = await charactersV2Api.getById(id);
      return response.data;
    },
    enabled: !!id,
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

export function useSetCharacterStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SetCharacterStatusRequest }) =>
      charactersV2Api.setStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Character status updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update character status';
      toast.error(message);
    },
  });
}

export function useUpdateHp() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateHpRequest }) =>
      charactersV2Api.updateHp(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      toast.success('HP updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update HP';
      toast.error(message);
    },
  });
}

export function useCharacterWallet(id: string) {
  return useQuery({
    queryKey: ['characters', id, 'wallet'],
    queryFn: async () => {
      const response = await charactersV2Api.getWallet(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateWallet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, currencyTypeId, data }: { id: string; currencyTypeId: string; data: UpdateWalletRequest }) =>
      charactersV2Api.updateWallet(id, currencyTypeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id, 'wallet'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      toast.success('Wallet updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update wallet';
      toast.error(message);
    },
  });
}

export function useCharacterResources(id: string) {
  return useQuery({
    queryKey: ['characters', id, 'resources'],
    queryFn: async () => {
      const response = await charactersV2Api.getResources(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useUpdateResource() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, resourceTypeId, data }: { id: string; resourceTypeId: string; data: UpdateResourceRequest }) =>
      charactersV2Api.updateResource(id, resourceTypeId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id, 'resources'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
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
    mutationFn: ({ id, statId }: { id: string; statId: string }) =>
      charactersV2Api.abilityCheck(id, statId),
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to perform ability check';
      toast.error(message);
    },
  });
}
