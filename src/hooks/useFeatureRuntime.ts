import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  featureRuntimeApi,
  type FeatureAction,
  type FeatureEffect,
  type FeatureResource,
  type PendingPrompt,
} from '@/api/featureRuntime.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError } from '@/types';

const resourcesKey = (characterId: string) => ['feature-resources', characterId] as const;
const effectsKey = (characterId: string) => ['feature-effects', characterId] as const;
const actionsKey = (characterId: string) => ['feature-actions', characterId] as const;
const promptsKey = (characterId: string) => ['feature-prompts', characterId] as const;

/** Feature-rules resource counters (Rage, Ki, Channel Divinity, …). Empty unless the runtime is on. */
export function useFeatureResources(characterId: string | undefined, enabled = true) {
  return useQuery<FeatureResource[]>({
    queryKey: resourcesKey(characterId ?? ''),
    queryFn: async () => (await featureRuntimeApi.listResources(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

/** Active feature effects (auras, marks, buffs) with remaining rounds / concentration. */
export function useFeatureEffects(characterId: string | undefined, enabled = true) {
  return useQuery<FeatureEffect[]>({
    queryKey: effectsKey(characterId ?? ''),
    queryFn: async () => (await featureRuntimeApi.listEffects(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

function useRuntimeInvalidator(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: resourcesKey(characterId) });
    queryClient.invalidateQueries({ queryKey: effectsKey(characterId) });
    queryClient.invalidateQueries({ queryKey: actionsKey(characterId) });
    queryClient.invalidateQueries({ queryKey: promptsKey(characterId) });
    queryClient.invalidateQueries({ queryKey: ['campaigns', campaignId, 'characters', characterId] });
    queryClient.invalidateQueries({ queryKey: ['capability-profile', characterId] });
  };
}

/** Durable pending gameplay prompts (reactions / optional triggers awaiting a decision). */
export function usePendingPrompts(characterId: string | undefined, enabled = true) {
  return useQuery<PendingPrompt[]>({
    queryKey: promptsKey(characterId ?? ''),
    queryFn: async () => (await featureRuntimeApi.listPendingPrompts(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

export function useResolvePrompt(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (promptId: string) => featureRuntimeApi.resolvePrompt(characterId, promptId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.featureRuntime.promptResolved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.promptFailed'));
    },
  });
}

export function useDeclinePrompt(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (promptId: string) => featureRuntimeApi.declinePrompt(characterId, promptId),
    onSuccess: () => invalidate(),
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.promptFailed'));
    },
  });
}

/** Feature actions the character can currently use (with action/resource cost + availability). */
export function useFeatureActions(characterId: string | undefined, enabled = true) {
  return useQuery<FeatureAction[]>({
    queryKey: actionsKey(characterId ?? ''),
    queryFn: async () => (await featureRuntimeApi.listActions(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

export function useUseFeature(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (featureId: string) => featureRuntimeApi.useFeature(characterId, featureId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.featureRuntime.used'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.useFailed'));
    },
  });
}

export function useSpendFeatureResource(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ resourceId, amount }: { resourceId: string; amount: number }) =>
      featureRuntimeApi.spendResource(characterId, resourceId, amount),
    onSuccess: () => invalidate(),
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.resourceFailed'));
    },
  });
}

export function useAdjustFeatureResource(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ resourceId, value }: { resourceId: string; value: number }) =>
      featureRuntimeApi.adjustResource(characterId, resourceId, value),
    onSuccess: () => invalidate(),
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.resourceFailed'));
    },
  });
}

export function useEndFeatureEffect(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useRuntimeInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (effectId: string) => featureRuntimeApi.endEffect(characterId, effectId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.featureRuntime.effectEnded'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRuntime.effectEndFailed'));
    },
  });
}
