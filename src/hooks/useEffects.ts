import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { effectsApi } from '@/api/effects.api';
import type { ApplyEffectRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useCharacterEffects(characterId: string) {
  return useQuery({
    queryKey: ['characters', characterId, 'effects'],
    queryFn: async () => {
      const response = await effectsApi.list(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useApplyEffect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, data }: { characterId: string; data: ApplyEffectRequest }) =>
      effectsApi.apply(characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Effect applied!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to apply effect';
      toast.error(message);
    },
  });
}

export function useRemoveEffect() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ characterId, effectId }: { characterId: string; effectId: string }) =>
      effectsApi.remove(characterId, effectId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      toast.success('Effect removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to remove effect';
      toast.error(message);
    },
  });
}

export function useAdvanceRound() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (characterId: string) => effectsApi.advanceRound(characterId),
    onSuccess: (_, characterId) => {
      queryClient.invalidateQueries({ queryKey: ['characters', characterId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['characters', characterId] });
      toast.success('Round advanced!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Failed to advance round';
      toast.error(message);
    },
  });
}
