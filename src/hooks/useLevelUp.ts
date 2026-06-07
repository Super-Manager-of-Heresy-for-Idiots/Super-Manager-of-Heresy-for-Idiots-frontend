import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { levelUpApi } from '@/api/levelup.api';
import { useT } from '@/i18n/I18nContext';
import type { LevelUpRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useLevelUpOptions(characterId: string) {
  return useQuery({
    queryKey: ['level-up-options', characterId],
    queryFn: async () => {
      const response = await levelUpApi.getOptions(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}

export function useLevelUp() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ characterId, data }: { characterId: string; data: LevelUpRequest }) =>
      levelUpApi.levelUp(characterId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['characters', variables.characterId] });
      queryClient.invalidateQueries({ queryKey: ['characters'] });
      queryClient.invalidateQueries({ queryKey: ['level-up-options', variables.characterId] });
      toast.success(t('hk.levelUp.success'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.levelUp.failed'));
    },
  });
}

export function useCharacterRewards(characterId: string) {
  return useQuery({
    queryKey: ['character-rewards', characterId],
    queryFn: async () => {
      const response = await levelUpApi.getRewards(characterId);
      return response.data;
    },
    enabled: !!characterId,
  });
}
