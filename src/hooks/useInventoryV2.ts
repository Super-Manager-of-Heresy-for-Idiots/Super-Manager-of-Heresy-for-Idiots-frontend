import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryV2Api } from '@/api/inventory-v2.api';
import type {
  GrantItemRequest,
  RenameItemRequest,
  TransferItemRequest,
  EquipItemRequest,
  CreateEnchantmentRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCharacterInventory(characterId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'inventory'],
    queryFn: async () => {
      const response = await inventoryV2Api.list(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useGrantItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, data }: { characterId: string; data: GrantItemRequest }) =>
      inventoryV2Api.grant(characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Item granted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to grant item');
    },
  });
}

export function useRemoveItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, instanceId }: { characterId: string; instanceId: string }) =>
      inventoryV2Api.remove(characterId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Item removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove item');
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      instanceId,
      data,
    }: {
      characterId: string;
      instanceId: string;
      data: EquipItemRequest;
    }) => inventoryV2Api.equip(characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Equipment updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to equip item');
    },
  });
}

export function useRenameItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      instanceId,
      data,
    }: {
      characterId: string;
      instanceId: string;
      data: RenameItemRequest;
    }) => inventoryV2Api.rename(characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'inventory'] });
      toast.success('Item renamed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to rename item');
    },
  });
}

export function useTransferItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      fromCharId,
      instanceId,
      data,
    }: {
      campaignId: string;
      fromCharId: string;
      instanceId: string;
      data: TransferItemRequest;
    }) => inventoryV2Api.transfer(campaignId, fromCharId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.fromCharId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Item transferred!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to transfer item');
    },
  });
}

// Enchantments on item instances

export function useInstanceEnchantments(characterId: string, instanceId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'inventory', instanceId, 'enchantments'],
    queryFn: async () => {
      const response = await inventoryV2Api.getEnchantments(characterId, instanceId);
      return response.data;
    },
    enabled: !!characterId && !!instanceId,
  });
}

export function useAddInstanceEnchantment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      instanceId,
      data,
    }: {
      characterId: string;
      instanceId: string;
      data: CreateEnchantmentRequest;
    }) => inventoryV2Api.addEnchantment(characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory'],
      });
      toast.success('Enchantment applied!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to apply enchantment');
    },
  });
}

export function useRemoveInstanceEnchantment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      instanceId,
      enchantmentId,
    }: {
      characterId: string;
      instanceId: string;
      enchantmentId: string;
    }) => inventoryV2Api.removeEnchantment(characterId, instanceId, enchantmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory'],
      });
      toast.success('Enchantment removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove enchantment');
    },
  });
}
