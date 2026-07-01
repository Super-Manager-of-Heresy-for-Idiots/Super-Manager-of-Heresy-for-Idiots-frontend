import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { inventoryApi } from '@/api/inventory.api';
import { itemTemplatesApi } from '@/api/item-templates.api';
import { useT } from '@/i18n/I18nContext';
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
      const response = await inventoryApi.list(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useEquippedInventory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', 'equipped'],
    queryFn: async () => {
      const response = await inventoryApi.listEquipped(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useBackpackInventory(campaignId: string, characterId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', 'backpack'],
    queryFn: async () => {
      const response = await inventoryApi.listBackpack(campaignId, characterId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId,
  });
}

export function useGrantItem() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, data }: { campaignId?: string; characterId: string; data: GrantItemRequest }) =>
      inventoryApi.grant(campaignId || '_', characterId, data),
    onSuccess: (_, variables) => {
      if (variables.campaignId) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
        queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      }
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success(t('hk.inventory.itemGranted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.grantFailed'));
    },
  });
}

export function useRemoveItem() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, characterId, instanceId }: { campaignId: string; characterId: string; instanceId: string }) =>
      inventoryApi.remove(campaignId, characterId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.inventory.itemRemoved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.removeFailed'));
    },
  });
}

export function useEquipItem() {
  const queryClient = useQueryClient();
  const t = useT();

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
    }) => inventoryApi.equip(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.inventory.equipUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.equipFailed'));
    },
  });
}

export function useUnequipItem() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      instanceId,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
    }) => inventoryApi.unequip(campaignId, characterId, instanceId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success(t('hk.inventory.unequipped'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.unequipFailed'));
    },
  });
}

export function useRenameItem() {
  const queryClient = useQueryClient();
  const t = useT();

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
    }) => inventoryApi.rename(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      toast.success(t('hk.inventory.renamed'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.renameFailed'));
    },
  });
}

export function useUpdateItemBuffs() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      campaignId,
      characterId,
      instanceId,
      buffDebuffIds,
    }: {
      campaignId: string;
      characterId: string;
      instanceId: string;
      buffDebuffIds: string[];
    }) => inventoryApi.updateBuffs(campaignId, characterId, instanceId, { buffDebuffIds }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId] });
      toast.success('Item buffs updated');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update item buffs');
    },
  });
}

export function useTransferItem() {
  const queryClient = useQueryClient();
  const t = useT();

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
    }) => inventoryApi.transfer(campaignId, fromCharId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters', variables.fromCharId, 'inventory'] });
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success(t('hk.inventory.transferred'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.transferFailed'));
    },
  });
}

// Enchantments on item instances

export function useInstanceEnchantments(campaignId: string, characterId: string, instanceId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'characters', characterId, 'inventory', instanceId, 'enchantments'],
    queryFn: async () => {
      const response = await inventoryApi.getEnchantments(campaignId, characterId, instanceId);
      return response.data;
    },
    enabled: !!campaignId && !!characterId && !!instanceId,
  });
}

export function useAddInstanceEnchantment() {
  const queryClient = useQueryClient();
  const t = useT();

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
    }) => inventoryApi.addEnchantment(campaignId, characterId, instanceId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'],
      });
      toast.success(t('hk.inventory.enchantApplied'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.enchantApplyFailed'));
    },
  });
}

export function useRemoveInstanceEnchantment() {
  const queryClient = useQueryClient();
  const t = useT();

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
    }) => inventoryApi.removeEnchantment(campaignId, characterId, instanceId, enchantmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory', variables.instanceId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['campaigns', variables.campaignId, 'characters', variables.characterId, 'inventory'],
      });
      toast.success(t('hk.inventory.enchantRemoved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.inventory.enchantRemoveFailed'));
    },
  });
}
