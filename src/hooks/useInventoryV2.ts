import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryV2Api } from '@/api/inventory-v2.api';
import { itemTemplatesApi } from '@/api/item-templates.api';
import type {
  GrantItemRequest,
  RenameItemRequest,
  TransferItemRequest,
  EquipItemRequest,
  CreateEnchantmentRequest,
  ApiError,
} from '@/types';
import { AxiosError } from 'axios';

export function useCampaignItemTemplates(campaignId: string | undefined) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'item-templates'],
    queryFn: async () => {
      const response = await itemTemplatesApi.listForCampaign(campaignId!);
      return response.data ?? [];
    },
    enabled: !!campaignId,
  });
}

export function useCharacterInventory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory'],
    queryFn: async () => {
      const response = await inventoryV2Api.list(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useEquippedInventory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', 'equipped'],
    queryFn: async () => {
      const response = await inventoryV2Api.listEquipped(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useBackpackInventory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', 'backpack'],
    queryFn: async () => {
      const response = await inventoryV2Api.listBackpack(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useGrantItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId?: string; characterId: string; data: GrantItemRequest }) =>
      inventoryV2Api.grant(campaignId || '_', characterId, data),
    onSuccess: (_, variables) => {
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      }
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
    mutationFn: ({ campaignId, characterId, instanceId }: { campaignId: string; characterId: string; instanceId: string }) =>
      inventoryV2Api.remove(campaignId, characterId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
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
      campaignId,
      characterId,
      instanceId,
      data,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
      data: EquipItemRequest;
    }) => inventoryV2Api.equip(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Equipment updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to equip item');
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      instanceId,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
    }) => inventoryV2Api.unequip(campaignId, characterId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Item unequipped!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to unequip item');
    },
  });
}

export function useRenameItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      instanceId,
      data,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
      data: RenameItemRequest;
    }) => inventoryV2Api.rename(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
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
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.fromCharId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success('Item transferred!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to transfer item');
    },
  });
}

// Enchantments on item instances

export function useInstanceEnchantments(campaignId: string, characterId: string, instanceId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', instanceId, 'enchantments'],
    queryFn: async () => {
      const response = await inventoryV2Api.getEnchantments(campaignId, characterId, instanceId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId && !!instanceId,
  });
}

export function useAddInstanceEnchantment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      instanceId,
      data,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
      data: CreateEnchantmentRequest;
    }) => inventoryV2Api.addEnchantment(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'],
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
      campaignId,
      characterId,
      instanceId,
      enchantmentId,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
      enchantmentId: string;
    }) => inventoryV2Api.removeEnchantment(campaignId, characterId, instanceId, enchantmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'],
      });
      toast.success('Enchantment removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove enchantment');
    },
  });
}
