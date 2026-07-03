import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';
import {
  adminBestiaryApi,
  bestiaryApi,
  campaignMonsterApi,
  homebrewBestiaryApi,
} from '@/api/bestiary.api';
import { referenceApi } from '@/api/reference.api';
import { DICTIONARY_KINDS } from '@/components/bestiary/constants';
import { useI18n, useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  DictionaryEntryRequest,
  DictionaryEntryResponse,
  DictionaryKind,
  MonsterRequest,
} from '@/types';

function errMsg(error: unknown, fallback: string): string {
  const e = error as AxiosError<ApiError>;
  return e?.response?.data?.message || fallback;
}

const DICTS_KEY = ['bestiary', 'dicts'];

// ============================================================
// Shared: dictionaries for form selects + proficiency skills
// ============================================================

/**
 * Loads every dictionary kind (system) and, inside a homebrew package,
 * merges that package's homebrew entries on top (per contract TODO #2).
 */
export function useBestiaryDictionaries(packageId?: string) {
  return useQuery({
    queryKey: [...DICTS_KEY, packageId ?? 'system'],
    queryFn: async () => {
      const systemLists = await Promise.all(DICTIONARY_KINDS.map((k) => bestiaryApi.getDictionary(k)));
      const result = {} as Record<DictionaryKind, DictionaryEntryResponse[]>;
      DICTIONARY_KINDS.forEach((k, i) => {
        result[k] = systemLists[i].data ?? [];
      });
      if (packageId) {
        const hbLists = await Promise.all(DICTIONARY_KINDS.map((k) => homebrewBestiaryApi.getDictionary(packageId, k)));
        DICTIONARY_KINDS.forEach((k, i) => {
          result[k] = [...result[k], ...(hbLists[i].data ?? [])];
        });
      }
      return result;
    },
    staleTime: 10 * 60 * 1000,
  });
}

/** Proficiency skills power the `skillProficiencies` select. */
export function useProficiencySkills() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['reference', 'skills', lang],
    queryFn: async () => (await referenceApi.getSkills()).data ?? [],
    staleTime: 10 * 60 * 1000,
  });
}

// ============================================================
// 3.1 ADMIN — system bestiary
// ============================================================

export function useAdminMonsters() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'admin', 'monsters', lang],
    queryFn: async () => (await adminBestiaryApi.getMonsters()).data ?? [],
  });
}

export function useAdminMonster(id?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'admin', 'monster', id, lang],
    queryFn: async () => (await adminBestiaryApi.getMonster(id!)).data,
    enabled: !!id,
  });
}

export function useCreateAdminMonster() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: MonsterRequest) => adminBestiaryApi.createMonster(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'monsters'] });
      toast.success(t('best.toast.monsterCreated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.createFailed'))),
  });
}

export function useUpdateAdminMonster() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MonsterRequest }) => adminBestiaryApi.updateMonster(id, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'monsters'] });
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'monster', id] });
      toast.success(t('best.toast.monsterSaved'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.saveFailed'))),
  });
}

export function useSetAdminMonsterActive() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) => adminBestiaryApi.setMonsterActive(id, active),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'monsters'] });
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.activeFailed'))),
  });
}

export function useDeleteAdminMonster() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminBestiaryApi.deleteMonster(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'monsters'] });
      toast.success(t('best.toast.monsterDeleted'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.deleteFailed'))),
  });
}

export function useAdminDictionary(kind: DictionaryKind) {
  return useQuery({
    queryKey: ['bestiary', 'admin', 'dict', kind],
    queryFn: async () => (await adminBestiaryApi.getDictionary(kind)).data ?? [],
  });
}

export function useCreateAdminDictionaryEntry() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, data }: { kind: DictionaryKind; data: DictionaryEntryRequest }) =>
      adminBestiaryApi.createDictionaryEntry(kind, data),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryAdded'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entrySaveFailed'))),
  });
}

export function useUpdateAdminDictionaryEntry() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, id, data }: { kind: DictionaryKind; id: string; data: DictionaryEntryRequest }) =>
      adminBestiaryApi.updateDictionaryEntry(kind, id, data),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryUpdated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entrySaveFailed'))),
  });
}

export function useDeleteAdminDictionaryEntry() {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: DictionaryKind; id: string }) =>
      adminBestiaryApi.deleteDictionaryEntry(kind, id),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'admin', 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryDeleted'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entryDeleteFailed'))),
  });
}

// ============================================================
// 3.2 Public read-only (used by the shared detail page)
// ============================================================

export function usePublicMonster(id?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'public', 'monster', id, lang],
    queryFn: async () => (await bestiaryApi.getMonster(id!)).data,
    enabled: !!id,
  });
}

/** Active system monsters — used as clone/fork sources. */
export function usePublicMonsters(enabled = true) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'public', 'monsters', lang],
    queryFn: async () => (await bestiaryApi.getMonsters()).data ?? [],
    enabled,
    staleTime: 5 * 60 * 1000,
  });
}

// ============================================================
// 3.3 GAME_MASTER — homebrew package bestiary
// ============================================================

export function useHomebrewMonsters(packageId?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'homebrew', packageId, 'monsters', lang],
    queryFn: async () => (await homebrewBestiaryApi.getMonsters(packageId!)).data ?? [],
    enabled: !!packageId,
  });
}

export function useHomebrewMonster(packageId?: string, id?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'homebrew', packageId, 'monster', id, lang],
    queryFn: async () => (await homebrewBestiaryApi.getMonster(packageId!, id!)).data,
    enabled: !!packageId && !!id,
  });
}

export function useCreateHomebrewMonster(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: MonsterRequest) => homebrewBestiaryApi.createMonster(packageId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'monsters'] });
      toast.success(t('best.toast.monsterCreated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.createFailed'))),
  });
}

export function useDuplicateHomebrewMonster(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (sourceId: string) => homebrewBestiaryApi.duplicateMonster(packageId, sourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'monsters'] });
      toast.success(t('best.toast.monsterDuplicated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.duplicateFailed'))),
  });
}

export function useUpdateHomebrewMonster(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MonsterRequest }) => homebrewBestiaryApi.updateMonster(packageId, id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'monsters'] });
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'monster', id] });
      toast.success(t('best.toast.monsterSaved'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.saveFailed'))),
  });
}

export function useDeleteHomebrewMonster(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => homebrewBestiaryApi.deleteMonster(packageId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'monsters'] });
      toast.success(t('best.toast.monsterDeleted'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.deleteFailed'))),
  });
}

export function useHomebrewDictionary(packageId: string | undefined, kind: DictionaryKind) {
  return useQuery({
    queryKey: ['bestiary', 'homebrew', packageId, 'dict', kind],
    queryFn: async () => (await homebrewBestiaryApi.getDictionary(packageId!, kind)).data ?? [],
    enabled: !!packageId,
  });
}

export function useCreateHomebrewDictionaryEntry(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, data }: { kind: DictionaryKind; data: DictionaryEntryRequest }) =>
      homebrewBestiaryApi.createDictionaryEntry(packageId, kind, data),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryAdded'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entrySaveFailed'))),
  });
}

export function useUpdateHomebrewDictionaryEntry(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, id, data }: { kind: DictionaryKind; id: string; data: DictionaryEntryRequest }) =>
      homebrewBestiaryApi.updateDictionaryEntry(packageId, kind, id, data),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryUpdated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entrySaveFailed'))),
  });
}

export function useDeleteHomebrewDictionaryEntry(packageId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ kind, id }: { kind: DictionaryKind; id: string }) =>
      homebrewBestiaryApi.deleteDictionaryEntry(packageId, kind, id),
    onSuccess: (_r, { kind }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'homebrew', packageId, 'dict', kind] });
      qc.invalidateQueries({ queryKey: DICTS_KEY });
      toast.success(t('best.toast.entryDeleted'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.entryDeleteFailed'))),
  });
}

// ============================================================
// 3.4 Campaign GM — campaign monsters
// ============================================================

export function useCampaignMonsters(campaignId?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'campaign', campaignId, 'monsters', lang],
    queryFn: async () => (await campaignMonsterApi.getMonsters(campaignId!)).data ?? [],
    enabled: !!campaignId,
  });
}

export function useCampaignMonster(campaignId?: string, id?: string) {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['bestiary', 'campaign', campaignId, 'monster', id, lang],
    queryFn: async () => (await campaignMonsterApi.getMonster(campaignId!, id!)).data,
    enabled: !!campaignId && !!id,
    retry: false, // a hidden monster is a deliberate 404 — don't hammer it
  });
}

export function useCreateCampaignMonster(campaignId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: MonsterRequest) => campaignMonsterApi.createMonster(campaignId, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monsters'] });
      toast.success(t('best.toast.monsterCreated'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.createFailed'))),
  });
}

export function useCloneCampaignMonster(campaignId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (sourceId: string) => campaignMonsterApi.cloneMonster(campaignId, sourceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monsters'] });
      toast.success(t('best.toast.monsterCloned'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.cloneFailed'))),
  });
}

export function useUpdateCampaignMonster(campaignId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: MonsterRequest }) => campaignMonsterApi.updateMonster(campaignId, id, data),
    onSuccess: (_r, { id }) => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monsters'] });
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monster', id] });
      toast.success(t('best.toast.monsterSaved'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.saveFailed'))),
  });
}

export function useToggleCampaignMonsterVisibility(campaignId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => campaignMonsterApi.toggleVisibility(campaignId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monsters'] });
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.visibilityFailed'))),
  });
}

export function useDeleteCampaignMonster(campaignId: string) {
  const qc = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => campaignMonsterApi.deleteMonster(campaignId, id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bestiary', 'campaign', campaignId, 'monsters'] });
      toast.success(t('best.toast.monsterDeleted'));
    },
    onError: (e) => toast.error(errMsg(e, t('best.toast.deleteFailed'))),
  });
}
