import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
  charactersFullApi,
  type ContentCharacterCreationResponse,
  type CreateFullCharacterRequest,
} from '@/api/characters-full.api';
import type { ApiError, ApiResponse } from '@/types';
import { useT } from '@/i18n/I18nContext';

/**
 * Creates a character through the content-model wizard endpoint.
 */
export function useCreateFullCharacter() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation<ApiResponse<ContentCharacterCreationResponse>, AxiosError<ApiError>, CreateFullCharacterRequest>({
    mutationFn: (data) => charactersFullApi.createFull(data.campaignId, data),
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
