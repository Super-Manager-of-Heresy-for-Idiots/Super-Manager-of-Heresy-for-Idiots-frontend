import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin.api';
import { referenceApi } from '@/api/reference.api';
import { itemTemplatesApi } from '@/api/item-templates.api';
import { useI18n, useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  CreateStatTypeRequest,
  CreateItemTypeRequest,
  CreateItemTemplateRequest,
  CreateBuffDebuffRequest,
  CreateEnchantmentTypeRequest,
  UserResponse,
  Page,
  SpellResolutionRequest,
  UpdateSpellRequest,
} from '@/types';
import { AxiosError } from 'axios';

// === Stat Types ===
export function useStatTypes() {
  return useQuery({
    queryKey: ['stat-types'],
    queryFn: async () => {
      const response = await adminApi.getStatTypes();
      return response.data;
    },
  });
}

export function useCreateStatType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateStatTypeRequest) => adminApi.createStatType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success(t('hk.statType.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.statType.createFailed'));
    },
  });
}

export function useUpdateStatType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateStatTypeRequest }) =>
      adminApi.updateStatType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success(t('hk.statType.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.statType.updateFailed'));
    },
  });
}

export function useDeleteStatType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteStatType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success(t('hk.statType.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.statType.deleteFailed'));
    },
  });
}

// === Item Types ===
export function useItemTypes() {
  return useQuery({
    queryKey: ['item-types'],
    queryFn: async () => {
      const response = await adminApi.getItemTypes();
      return response.data;
    },
  });
}

export function useCreateItemType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateItemTypeRequest) => adminApi.createItemType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success(t('hk.itemType.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemType.createFailed'));
    },
  });
}

export function useUpdateItemType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateItemTypeRequest }) =>
      adminApi.updateItemType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success(t('hk.itemType.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemType.updateFailed'));
    },
  });
}

export function useDeleteItemType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteItemType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success(t('hk.itemType.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemType.deleteFailed'));
    },
  });
}

// === Item Templates (Admin authoring) ===
export function useAdminItemTemplates() {
  return useQuery({
    queryKey: ['admin-item-templates'],
    queryFn: async () => {
      const response = await itemTemplatesApi.listAll();
      return response.data;
    },
  });
}

export function useCreateItemTemplate() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateItemTemplateRequest) => itemTemplatesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-item-templates'] });
      toast.success(t('hk.itemTemplate.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemTemplate.createFailed'));
    },
  });
}

export function useUpdateItemTemplate() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateItemTemplateRequest }) =>
      itemTemplatesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-item-templates'] });
      toast.success(t('hk.itemTemplate.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemTemplate.updateFailed'));
    },
  });
}

export function useDeleteItemTemplate() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => itemTemplatesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-item-templates'] });
      toast.success(t('hk.itemTemplate.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.itemTemplate.deleteFailed'));
    },
  });
}

// === Character Classes ===
// Source of truth is the content model. The legacy create/update hooks were removed
// (their backend endpoints are gone — class authoring now goes through classAuthoringApi
// in the class-builder feature). The list reads /reference/classes so it reflects builder writes.
export function useCharacterClasses() {
  return useQuery({
    queryKey: ['character-classes'],
    queryFn: async () => {
      const response = await referenceApi.getClasses();
      return response.data;
    },
  });
}

// Legacy class level-rewards hooks removed — rewards are authored in the class-builder
// (classAuthoringApi) on the new content model.

// === Buffs / Debuffs ===
export function useBuffsDebuffs(params?: { isBuff?: boolean; effectType?: string }, enabled = true) {
  return useQuery({
    queryKey: ['buffs-debuffs', params],
    queryFn: async () => {
      const response = await adminApi.getBuffsDebuffs(params);
      return response.data;
    },
    enabled,
  });
}

export function useCreateBuffDebuff() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateBuffDebuffRequest) => adminApi.createBuffDebuff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success(t('hk.buff.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.buff.createFailed'));
    },
  });
}

export function useUpdateBuffDebuff() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBuffDebuffRequest }) =>
      adminApi.updateBuffDebuff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success(t('hk.buff.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.buff.updateFailed'));
    },
  });
}

export function useDeleteBuffDebuff() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBuffDebuff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success(t('hk.buff.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.buff.deleteInUse')
        : error.response?.data?.message || t('hk.buff.deleteFailed');
      toast.error(message);
    },
  });
}

// === Enchantment Types ===
export function useAdminEnchantmentTypes() {
  return useQuery({
    queryKey: ['admin-enchantment-types'],
    queryFn: async () => {
      const response = await adminApi.getEnchantmentTypes();
      return response.data;
    },
  });
}

export function useCreateEnchantmentType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateEnchantmentTypeRequest) => adminApi.createEnchantmentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success(t('hk.enchantType.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.enchantType.createFailed'));
    },
  });
}

export function useUpdateEnchantmentType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateEnchantmentTypeRequest }) =>
      adminApi.updateEnchantmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success(t('hk.enchantType.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.enchantType.updateFailed'));
    },
  });
}

export function useDeleteEnchantmentType() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteEnchantmentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success(t('hk.enchantType.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.enchantType.deleteInUse')
        : error.response?.data?.message || t('hk.enchantType.deleteFailed');
      toast.error(message);
    },
  });
}

// === Users (read-only, ADMIN) ===
export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async (): Promise<UserResponse[]> => {
      const response = await adminApi.getUsers();
      const data = response.data as UserResponse[] | Page<UserResponse> | undefined;
      if (Array.isArray(data)) return data;
      return data?.content ?? [];
    },
  });
}

// === Spell resolution review (data-quality) ===
export function useSpellWarnings() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['spell-warnings', lang],
    queryFn: async () => {
      const response = await adminApi.getSpellWarnings(lang);
      return response.data ?? [];
    },
  });
}

export function useResolveSpell() {
  const queryClient = useQueryClient();
  const t = useT();
  const { lang } = useI18n();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SpellResolutionRequest }) =>
      adminApi.resolveSpell(id, data, lang),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spell-warnings'] });
      toast.success(t('hk.spellWarn.resolved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellWarn.resolveFailed'));
    },
  });
}

/** Full admin edit of a spell (damage/healing/save/attack/check/warning). */
export function useUpdateSpell() {
  const queryClient = useQueryClient();
  const t = useT();
  const { lang } = useI18n();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSpellRequest }) =>
      adminApi.updateSpell(id, data, lang),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', 'spells'] });
      queryClient.invalidateQueries({ queryKey: ['spell-warnings'] });
      toast.success(t('hk.spellEdit.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellEdit.saveFailed'));
    },
  });
}

// === Spell ↔ buff/debuff links ===

/** The buffs/debuffs currently linked to a spell. */
export function useSpellBuffs(spellId: string, enabled = true) {
  return useQuery({
    queryKey: ['content', 'spells', spellId, 'buffs'],
    queryFn: async () => (await adminApi.getSpellBuffs(spellId)).data ?? [],
    enabled: !!spellId && enabled,
  });
}

/** Replaces the full set of buffs/debuffs a spell applies. */
export function useSetSpellBuffs() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ spellId, buffDebuffIds }: { spellId: string; buffDebuffIds: string[] }) =>
      adminApi.setSpellBuffs(spellId, buffDebuffIds),
    onSuccess: (_res, { spellId }) => {
      queryClient.invalidateQueries({ queryKey: ['content', 'spells', spellId, 'buffs'] });
      toast.success(t('hk.spellBuffs.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.spellBuffs.saveFailed'));
    },
  });
}

// === Admin Teams (read-only) ===
