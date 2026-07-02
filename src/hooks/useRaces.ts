import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import { racesApi } from '@/api/races.api';
import { useT } from '@/i18n/I18nContext';
import type { ApiError, RaceRequest } from '@/types';

const homebrewListKey = (packageId: string) => ['races', 'homebrew', packageId];
const campaignListKey = (campaignId: string) => ['races', 'campaign', campaignId];

// === ADMIN ===

// === GM HOMEBREW ===

export function useCreateHomebrewRace() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, data }: { packageId: string; data: RaceRequest }) =>
      racesApi.homebrewCreate(packageId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: homebrewListKey(vars.packageId) });
      qc.invalidateQueries({ queryKey: ['homebrew-my'] });
      qc.invalidateQueries({ queryKey: ['homebrew-my', vars.packageId] });
      toast.success(t('hk.races.homebrewCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.races.homebrewCreateFailed'));
    },
  });
}

export function useUpdateHomebrewRace() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, raceId, data }: { packageId: string; raceId: string; data: RaceRequest }) =>
      racesApi.homebrewUpdate(packageId, raceId, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: homebrewListKey(vars.packageId) });
      qc.invalidateQueries({ queryKey: ['homebrew-my', vars.packageId] });
      toast.success(t('hk.races.homebrewUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.races.homebrewUpdateFailed'));
    },
  });
}

export function useEnableHomebrewRace() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, raceId }: { packageId: string; raceId: string }) =>
      racesApi.homebrewEnable(packageId, raceId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: homebrewListKey(vars.packageId) });
      qc.invalidateQueries({ queryKey: ['homebrew-my', vars.packageId] });
      toast.success(t('hk.races.homebrewEnabled'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.races.homebrewEnableFailed'));
    },
  });
}

export function useDisableHomebrewRace() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, raceId }: { packageId: string; raceId: string }) =>
      racesApi.homebrewDisable(packageId, raceId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: homebrewListKey(vars.packageId) });
      qc.invalidateQueries({ queryKey: ['homebrew-my', vars.packageId] });
      toast.success(t('hk.races.homebrewDisabled'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.races.homebrewDisableFailed'));
    },
  });
}

export function useDuplicateSystemRace() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ packageId, systemRaceId }: { packageId: string; systemRaceId: string }) =>
      racesApi.homebrewDuplicate(packageId, systemRaceId),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: homebrewListKey(vars.packageId) });
      qc.invalidateQueries({ queryKey: ['homebrew-my', vars.packageId] });
      toast.success(t('hk.races.duplicated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.races.duplicateFailed'));
    },
  });
}

// === PLAYER / CAMPAIGN ===

export function useCampaignRaces(campaignId: string | undefined) {
  return useQuery({
    queryKey: campaignId ? campaignListKey(campaignId) : ['races', 'campaign', 'none'],
    queryFn: async () => {
      const response = await racesApi.campaignList(campaignId!);
      return response.data ?? [];
    },
    enabled: !!campaignId,
  });
}

export function useCampaignRace(campaignId: string | undefined, raceId: string | undefined) {
  return useQuery({
    queryKey: ['races', 'campaign', campaignId, raceId],
    queryFn: async () => {
      const response = await racesApi.campaignGet(campaignId!, raceId!);
      return response.data;
    },
    enabled: !!campaignId && !!raceId,
  });
}
