import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { campApi } from '@/api/camp.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  ApplyPartialRestRequest,
  AssignCampActivityRequest,
  CampRestSummaryResponse,
  CompleteCampRestRequest,
  CreateCampActivityRequest,
  CreateCampEventRequest,
  CreateCampRequest,
  InterruptCampRequest,
  StartCampRestRequest,
  UpdateCampRequest,
  UpdateCampWatchOrderRequest,
} from '@/types';

/** Ключ текущего привала кампании. */
export const campQueryKey = (campaignId: string) => ['campaigns', campaignId, 'camp'] as const;

/** Текущий незавершённый привал; `null`, если лагерь не разбит. */
export function useCurrentCamp(campaignId: string) {
  return useQuery({
    queryKey: campQueryKey(campaignId),
    queryFn: async () => {
      const response = await campApi.current(campaignId);
      return response.data ?? null;
    },
    enabled: !!campaignId,
  });
}

/** Архив привалов кампании, свежие первыми. */
export function useCampHistory(campaignId: string, enabled = true) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'camp', 'history'],
    queryFn: async () => {
      const response = await campApi.history(campaignId);
      return response.data;
    },
    enabled: !!campaignId && enabled,
  });
}

/**
 * Общая реакция на изменение привала: состояние привала перечитывается с сервера,
 * а листы персонажей инвалидируются, потому что отдых меняет хиты, ресурсы и ячейки.
 */
function useCampInvalidation() {
  const queryClient = useQueryClient();
  return (campaignId: string, touchesCharacters = false) => {
    queryClient.invalidateQueries({ queryKey: campQueryKey(campaignId) });
    if (touchesCharacters) {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters'] });
    }
  };
}

export function useCreateCamp() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateCampRequest }) =>
      campApi.create(campaignId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.createFailed'));
    },
  });
}

export function useUpdateCamp() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId, data }: { campaignId: string; campId: string; data: UpdateCampRequest }) =>
      campApi.update(campaignId, campId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.updateFailed'));
    },
  });
}

export function useUpdateWatchOrder() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      campId,
      data,
    }: { campaignId: string; campId: string; data: UpdateCampWatchOrderRequest }) =>
      campApi.updateWatchOrder(campaignId, campId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.watchUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.watchFailed'));
    },
  });
}

export function useStartCamp() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId }: { campaignId: string; campId: string }) =>
      campApi.start(campaignId, campId),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.started'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.transitionFailed'));
    },
  });
}

export function useStartCampRest() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId, data }: { campaignId: string; campId: string; data: StartCampRestRequest }) =>
      campApi.startRest(campaignId, campId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.restStarted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.restStartFailed'));
    },
  });
}

/**
 * Применение группового отдыха. Ответ содержит и успешные результаты, и ошибки:
 * частичный успех — штатный исход, поэтому тост выбирается по сводке, а не по HTTP-статусу.
 */
export function useCompleteCampRest() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      campId,
      data,
    }: { campaignId: string; campId: string; data?: CompleteCampRestRequest }) =>
      campApi.completeRest(campaignId, campId, data),
    onSuccess: (response, { campaignId }) => {
      invalidate(campaignId, true);
      notifyRestSummary(response.data, t);
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.restApplyFailed'));
    },
  });
}

export function useInterruptCamp() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId, data }: { campaignId: string; campId: string; data?: InterruptCampRequest }) =>
      campApi.interrupt(campaignId, campId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.interrupted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.transitionFailed'));
    },
  });
}

export function useApplyPartialRest() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      campId,
      data,
    }: { campaignId: string; campId: string; data?: ApplyPartialRestRequest }) =>
      campApi.applyPartialRest(campaignId, campId, data),
    onSuccess: (response, { campaignId }) => {
      invalidate(campaignId, true);
      notifyRestSummary(response.data, t);
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.restApplyFailed'));
    },
  });
}

export function useEndCamp() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId }: { campaignId: string; campId: string }) =>
      campApi.end(campaignId, campId),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.ended'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.transitionFailed'));
    },
  });
}

/**
 * Запись события журнала. Засада может создать бой и прервать привал, поэтому
 * инвалидируется и список боёв кампании.
 */
export function useCreateCampEvent() {
  const queryClient = useQueryClient();
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      campId,
      data,
    }: { campaignId: string; campId: string; data: CreateCampEventRequest }) =>
      campApi.createEvent(campaignId, campId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
      toast.success(t('campfire.toast.eventCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.eventFailed'));
    },
  });
}

export function useTriggerCampEvent() {
  const queryClient = useQueryClient();
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId, eventId }: { campaignId: string; campId: string; eventId: string }) =>
      campApi.triggerEvent(campaignId, campId, eventId),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'battles'] });
      toast.success(t('campfire.toast.eventTriggered'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.eventFailed'));
    },
  });
}

export function useDeleteCampEvent() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, campId, eventId }: { campaignId: string; campId: string; eventId: string }) =>
      campApi.deleteEvent(campaignId, campId, eventId),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.eventDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.eventFailed'));
    },
  });
}

/** Справочник даунтайм-активностей кампании: системные плюс кастомные. */
export function useCampActivities(campaignId: string) {
  return useQuery({
    queryKey: ['campaigns', campaignId, 'camp', 'activities'],
    queryFn: async () => {
      const response = await campApi.listActivities(campaignId);
      return response.data;
    },
    enabled: !!campaignId,
  });
}

export function useCreateCampActivity() {
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, data }: { campaignId: string; data: CreateCampActivityRequest }) =>
      campApi.createActivity(campaignId, data),
    onSuccess: (_response, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'camp', 'activities'] });
      toast.success(t('campfire.toast.activityCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.activityFailed'));
    },
  });
}

export function useDeleteCampActivity() {
  const queryClient = useQueryClient();
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({ campaignId, activityId }: { campaignId: string; activityId: string }) =>
      campApi.deleteActivity(campaignId, activityId),
    onSuccess: (_response, { campaignId }) => {
      queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'camp', 'activities'] });
      invalidate(campaignId);
      toast.success(t('campfire.toast.activityDeleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.activityFailed'));
    },
  });
}

export function useAssignCampActivity() {
  const invalidate = useCampInvalidation();
  const t = useT();

  return useMutation({
    mutationFn: ({
      campaignId,
      campId,
      characterId,
      data,
    }: { campaignId: string; campId: string; characterId: string; data: AssignCampActivityRequest }) =>
      campApi.assignActivity(campaignId, campId, characterId, data),
    onSuccess: (_response, { campaignId }) => {
      invalidate(campaignId);
      toast.success(t('campfire.toast.activityAssigned'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('campfire.toast.activityFailed'));
    },
  });
}

function notifyRestSummary(
  summary: CampRestSummaryResponse | undefined,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  if (!summary) return;
  if (summary.failedCount > 0) {
    toast.error(t('campfire.toast.restPartial', {
      rested: summary.restedCount,
      failed: summary.failedCount,
    }));
    return;
  }
  toast.success(t('campfire.toast.restApplied', { rested: summary.restedCount }));
}
