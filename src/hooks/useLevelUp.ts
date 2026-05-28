import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { levelUpApi } from '@/api/levelup.api';
import type { LevelUpRequest } from '@/types';

export function useCharacterDetailed(id: string) {
  return useQuery({
    queryKey: ['character-detailed', id],
    queryFn: () => levelUpApi.getCharacterDetailed(id),
    select: (data) => data.data,
    enabled: !!id,
  });
}

export function useLevelUpPreview(characterId: string, enabled = true) {
  return useQuery({
    queryKey: ['level-up-preview', characterId],
    queryFn: () => levelUpApi.getLevelUpPreview(characterId),
    select: (data) => data.data,
    enabled: !!characterId && enabled,
  });
}

export function useCommitLevelUp(characterId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LevelUpRequest) => levelUpApi.commitLevelUp(characterId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-detailed', characterId] });
      queryClient.invalidateQueries({ queryKey: ['level-up-preview', characterId] });
      queryClient.invalidateQueries({ queryKey: ['acquired-rewards', characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
    },
  });
}

export function useAcquiredRewards(characterId: string) {
  return useQuery({
    queryKey: ['acquired-rewards', characterId],
    queryFn: () => levelUpApi.getAcquiredRewards(characterId),
    select: (data) => data.data,
    enabled: !!characterId,
  });
}
