import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
  charactersFullApi,
  isEndpointMissing,
  type CreateFullCharacterRequest,
} from '@/api/characters-full.api';
import type { ApiError, ApiResponse, CharacterResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

/**
 * Creates a character through the rich wizard payload.
 *
 * Strategy: try the aggregate `/characters/full` endpoint first. If the
 * backend has not shipped it yet (404/405/501), transparently fall back to
 * the existing minimal create endpoint using the resolved class/race ids, so
 * the wizard remains the single creation path and works today.
 */
export function useCreateFullCharacter() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation<ApiResponse<CharacterResponse>, AxiosError<ApiError>, CreateFullCharacterRequest>({
    mutationFn: async (data) => {
      try {
        return await charactersFullApi.createFull(data.campaignId, data);
      } catch (error) {
        if (isEndpointMissing(error)) {
          return await charactersFullApi.createBasic(data.campaignId, {
            campaignId: data.campaignId,
            name: data.name,
            classId: data.classId,
            raceId: data.raceId,
            selectedLineageId: data.selectedLineageId ?? null,
          });
        }
        throw error;
      }
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'characters'] });
      toast.success(t('hk.fullCharacter.forged'));
    },
    onError: (error) => {
      const message = error.response?.data?.message || t('hk.fullCharacter.forgeFailed');
      toast.error(message);
    },
  });
}
