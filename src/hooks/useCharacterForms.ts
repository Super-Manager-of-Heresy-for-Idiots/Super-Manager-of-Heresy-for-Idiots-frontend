import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  characterFormsApi,
  type Companion,
  type KnownForm,
  type Transformation,
} from '@/api/characterForms.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError } from '@/types';

const formsKey = (characterId: string) => ['character-forms', characterId] as const;
const transformationKey = (characterId: string) => ['character-transformation', characterId] as const;
const companionsKey = (characterId: string) => ['character-companions', characterId] as const;

export function useKnownForms(characterId: string | undefined, enabled = true) {
  return useQuery<KnownForm[]>({
    queryKey: formsKey(characterId ?? ''),
    queryFn: async () => (await characterFormsApi.listForms(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

export function useTransformation(characterId: string | undefined, enabled = true) {
  return useQuery<Transformation | null>({
    queryKey: transformationKey(characterId ?? ''),
    queryFn: async () => (await characterFormsApi.getTransformation(characterId as string)).data ?? null,
    enabled: !!characterId && enabled,
  });
}

export function useCompanions(characterId: string | undefined, enabled = true) {
  return useQuery<Companion[]>({
    queryKey: companionsKey(characterId ?? ''),
    queryFn: async () => (await characterFormsApi.listCompanions(characterId as string)).data ?? [],
    enabled: !!characterId && enabled,
  });
}

function useFormsInvalidator(campaignId: string, characterId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: formsKey(characterId) });
    queryClient.invalidateQueries({ queryKey: transformationKey(characterId) });
    queryClient.invalidateQueries({ queryKey: companionsKey(characterId) });
    queryClient.invalidateQueries({ queryKey: ['capability-profile', characterId] });
  };
}

export function useLearnForm(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ monsterId, sourceFeatureId }: { monsterId: string; sourceFeatureId?: string }) =>
      characterFormsApi.learnForm(characterId, monsterId, sourceFeatureId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.learned'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.learnFailed')),
  });
}

export function useApproveForm(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (formId: string) => characterFormsApi.approveForm(characterId, formId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.approved'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.approveFailed')),
  });
}

export function useTransform(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ monsterId, sourceFeatureId }: { monsterId: string; sourceFeatureId?: string }) =>
      characterFormsApi.transform(characterId, monsterId, sourceFeatureId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.transformed'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.transformFailed')),
  });
}

export function useEndTransformation(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: () => characterFormsApi.endTransformation(characterId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.reverted'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.transformFailed')),
  });
}

export function useCreateCompanion(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: ({ monsterId, sourceFeatureId, name }: { monsterId?: string; sourceFeatureId?: string; name?: string }) =>
      characterFormsApi.createCompanion(characterId, monsterId, sourceFeatureId, name),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.companionCreated'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.companionFailed')),
  });
}

export function useDismissCompanion(campaignId: string, characterId: string) {
  const t = useT();
  const invalidate = useFormsInvalidator(campaignId, characterId);
  return useMutation({
    mutationFn: (companionId: string) => characterFormsApi.dismissCompanion(characterId, companionId),
    onSuccess: () => {
      invalidate();
      toast.success(t('hk.forms.companionDismissed'));
    },
    onError: (e: AxiosError<ApiError>) => toast.error(e.response?.data?.message || t('hk.forms.companionFailed')),
  });
}
