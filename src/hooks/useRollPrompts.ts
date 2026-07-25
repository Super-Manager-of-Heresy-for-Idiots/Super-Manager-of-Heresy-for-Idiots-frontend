import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import { rollPromptsApi } from '@/api/rollPrompts.api';
import { wsService } from '@/lib/websocket';
import type {
  ApiError,
  CreateRollPromptRequest,
  RollPromptStatus,
  WsEvent,
} from '@/types';

function errMessage(error: unknown, fallback: string): string {
  const axiosErr = error as AxiosError<ApiError>;
  return axiosErr.response?.data?.message || fallback;
}

const ROLL_PROMPT_EVENTS = new Set(['ROLL_PROMPT_CREATED', 'ROLL_PROMPT_RESOLVED', 'ROLL_PROMPT_CANCELLED']);

/**
 * Список запросов проверок (мастер — все, игрок — своих персонажей) с live-обновлением:
 * WS-события ROLL_PROMPT_* инвалидируют кэш; refetchInterval — страховка при разрыве WS.
 */
export function useRollPrompts(campaignId: string, status?: RollPromptStatus) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!campaignId) return;
    const handler = (event: WsEvent) => {
      if (event.campaignId === campaignId && ROLL_PROMPT_EVENTS.has(event.type)) {
        queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'roll-prompts'] });
      }
    };
    wsService.onEvent(handler);
    return () => wsService.offEvent(handler);
  }, [campaignId, queryClient]);

  return useQuery({
    queryKey: ['campaigns', campaignId, 'roll-prompts', status ?? 'ALL'],
    queryFn: async () => {
      const response = await rollPromptsApi.list(campaignId, status);
      return response.data;
    },
    enabled: !!campaignId,
    refetchInterval: 15_000,
  });
}

/** Мастер запрашивает проверку у выбранных персонажей. */
export function useCreateRollPrompts() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateRollPromptRequest }) =>
      rollPromptsApi.create(campaignId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'roll-prompts'] });
      toast.success('Запрос на проверку отправлен');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось запросить проверку')),
  });
}

/** Игрок совершает бросок (d20 исполняется на сервере). */
export function useRollPromptRoll() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, promptId }: { campaignId: string; promptId: string }) =>
      rollPromptsApi.roll(campaignId, promptId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'roll-prompts'] });
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось совершить бросок')),
  });
}

/** Мастер отменяет ожидающий запрос. */
export function useCancelRollPrompt() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ campaignId, promptId }: { campaignId: string; promptId: string }) =>
      rollPromptsApi.cancel(campaignId, promptId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', variables.campaignId, 'roll-prompts'] });
      toast.success('Запрос отменён');
    },
    onError: (error) => toast.error(errMessage(error, 'Не удалось отменить запрос')),
  });
}
