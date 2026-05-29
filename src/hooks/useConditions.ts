import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { conditionsApi } from '@/api/conditions.api';
import type { CreateConditionRequest, AddConditionModifierRequest, ApplyConditionRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useConditions() {
  return useQuery({
    queryKey: ['conditions'],
    queryFn: async () => {
      const response = await conditionsApi.list();
      return response.data;
    },
  });
}

export function useCondition(id: string) {
  return useQuery({
    queryKey: ['conditions', id],
    queryFn: async () => {
      const response = await conditionsApi.getById(id);
      return response.data;
    },
    enabled: !!id,
  });
}

export function useCreateCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateConditionRequest) => conditionsApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Condition created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create condition');
    },
  });
}

export function useUpdateCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateConditionRequest }) =>
      conditionsApi.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      queryClient.invalidateQueries({ queryKey: ['conditions', variables.id] });
      toast.success('Condition updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update condition');
    },
  });
}

export function useDeleteCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => conditionsApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Condition deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete condition');
    },
  });
}

export function useAddConditionModifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conditionId, data }: { conditionId: string; data: AddConditionModifierRequest }) =>
      conditionsApi.addModifier(conditionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Modifier added!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to add modifier');
    },
  });
}

export function useDeleteConditionModifier() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ conditionId, modifierId }: { conditionId: string; modifierId: string }) =>
      conditionsApi.deleteModifier(conditionId, modifierId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conditions'] });
      toast.success('Modifier removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove modifier');
    },
  });
}

export function useApplyCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, data }: { characterId: string; data: ApplyConditionRequest }) =>
      conditionsApi.applyToCharacter(characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['character-conditions', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'stats'] });
      toast.success('Condition applied!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to apply condition');
    },
  });
}

export function useCharacterConditions(characterId: string) {
  return useQuery({
    queryKey: ['character-conditions', characterId],
    queryFn: async () => {
      const response = await conditionsApi.getCharacterConditions(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useRemoveCondition() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ characterId, characterConditionId }: { characterId: string; characterConditionId: string }) =>
      conditionsApi.removeFromCharacter(characterId, characterConditionId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['character-conditions', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId, 'stats'] });
      toast.success('Condition removed!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to remove condition');
    },
  });
}
