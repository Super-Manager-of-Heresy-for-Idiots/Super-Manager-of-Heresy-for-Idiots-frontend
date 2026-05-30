import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { enchantmentsApi } from '@/api/enchantments.api';
import type { CreateEnchantmentRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

// Public catalog of enchantment types (available to all authenticated users)
export function useEnchantmentTypes() {
  return useQuery({
    queryKey: ['enchantment-types'],
    queryFn: async () => {
      const response = await enchantmentsApi.getTypes();
      return response.data;
    },
  });
}

// Get enchantments on a specific inventory slot
export function useSlotEnchantments(characterId: string, slotId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'inventory', slotId, 'enchantments'],
    queryFn: async () => {
      const response = await enchantmentsApi.getSlotEnchantments(characterId, slotId);
      return response.data;
    },
    enabled: !!characterId && !!slotId,
  });
}

// Add enchantment to inventory slot
export function useAddEnchantment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      slotId,
      data,
    }: {
      characterId: string;
      slotId: string;
      data: CreateEnchantmentRequest;
    }) => enchantmentsApi.addEnchantment(characterId, slotId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory', variables.slotId, 'enchantments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory'],
      });
      toast.success('Enchantment applied!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const msg = error.response?.data?.message || 'Failed to apply enchantment';
      toast.error(msg);
    },
  });
}

// Remove enchantment from inventory slot
export function useRemoveEnchantment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      characterId,
      slotId,
      enchantmentId,
    }: {
      characterId: string;
      slotId: string;
      enchantmentId: string;
    }) => enchantmentsApi.removeEnchantment(characterId, slotId, enchantmentId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory', variables.slotId, 'enchantments'],
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
