import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { charactersApi } from '@/api/characters.api';
import type {
  CreateCharacterRequest,
  UpdateCharacterRequest,
  UpdateStatRequest,
  UpdateInventorySlotRequest,
  EquipmentSlot,
  ApiError,
  CharacterStatResponse,
} from '@/types';
import { AxiosError } from 'axios';

export function useCharacters() {
  return useQuery({
    queryKey: ['characters'],
    queryFn: async () => {
      const response = await charactersApi.list();
      return response.data;
    },
  });
}

export function useCharacter(id: string) {
  return useQuery({
    queryKey: ['characters', id],
    queryFn: async () => {
      const response = await charactersApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCharacterRequest) => charactersApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Character created successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to create character';
      toast.error(message);
    },
  });
}

export function useUpdateCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateCharacterRequest }) =>
      charactersApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.id] });
      toast.success('Character updated successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update character';
      toast.error(message);
    },
  });
}

export function useDeleteCharacter() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => charactersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      toast.success('Character deleted successfully!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to delete character';
      toast.error(message);
    },
  });
}

export function useCharacterStats(characterId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'stats'],
    queryFn: async () => {
      const response = await charactersApi.getStats(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useUpdateStat() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      statId,
      data,
    }: {
      characterId: string;
      statId: string;
      data: UpdateStatRequest;
    }) => charactersApi.updateStat(characterId, statId, data),
    onMutate: async ({ characterId, statId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['characters', characterId, 'stats'] });
      const previousStats = queryClient.getQueryData<CharacterStatResponse[]>(['characters', characterId, 'stats']);
      queryClient.setQueryData<CharacterStatResponse[]>(
        ['characters', characterId, 'stats'],
        (old) => old?.map((s) => (s.id === statId ? { ...s, value: data.value } : s))
      );
      return { previousStats };
    },
    onError: (error: AxiosError<ApiError>, variables, context) => {
      if (context?.previousStats) {
        queryClient.setQueryData(
          ['characters', variables.characterId, 'stats'],
          context.previousStats
        );
      }
      const message = error.response?.data?.message || 'Failed to update stat';
      toast.error(message);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Stat updated!');
    },
  });
}

export function useCharacterInventory(characterId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'inventory'],
    queryFn: async () => {
      const response = await charactersApi.getInventory(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useUpdateInventorySlot() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      characterId,
      slot,
      data,
    }: {
      characterId: string;
      slot: EquipmentSlot;
      data: UpdateInventorySlotRequest;
    }) => charactersApi.updateInventorySlot(characterId, slot, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId, 'inventory'],
      });
      queryClient.invalidateQueries({
        queryKey: ['characters', variables.characterId],
      });
      toast.success('Equipment updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to update equipment';
      toast.error(message);
    },
  });
}
