import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  CreateStatTypeRequest,
  CreateItemTypeRequest,
  CreateCharacterClassRequest,
  CreateCharacterRaceRequest,
  CreateSkillRequest,
  CreateSubclassRequest,
  CreateFeatRequest,
  CreateClassLevelRewardRequest,
  CreateBuffDebuffRequest,
  CreateEnchantmentTypeRequest,
  SetSkillEffectsRequest,
  UserResponse,
  Page,
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

// === Character Classes ===
export function useCharacterClasses() {
  return useQuery({
    queryKey: ['character-classes'],
    queryFn: async () => {
      const response = await adminApi.getCharacterClasses();
      return response.data;
    },
  });
}

export function useCreateCharacterClass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateCharacterClassRequest) => adminApi.createCharacterClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success(t('hk.class.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.class.createFailed'));
    },
  });
}

export function useUpdateCharacterClass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCharacterClassRequest }) =>
      adminApi.updateCharacterClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success(t('hk.class.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.class.updateFailed'));
    },
  });
}

export function useDeleteCharacterClass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCharacterClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success(t('hk.class.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.class.deleteInUse')
        : error.response?.data?.message || t('hk.class.deleteFailed');
      toast.error(message);
    },
  });
}

// === Character Races ===
export function useCharacterRaces() {
  return useQuery({
    queryKey: ['character-races'],
    queryFn: async () => {
      const response = await adminApi.getCharacterRaces();
      return response.data;
    },
  });
}

export function useCreateCharacterRace() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateCharacterRaceRequest) => adminApi.createCharacterRace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success(t('hk.race.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.race.createFailed'));
    },
  });
}

export function useUpdateCharacterRace() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCharacterRaceRequest }) =>
      adminApi.updateCharacterRace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success(t('hk.race.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.race.updateFailed'));
    },
  });
}

export function useDeleteCharacterRace() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCharacterRace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success(t('hk.race.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? t('hk.race.deleteInUse')
        : error.response?.data?.message || t('hk.race.deleteFailed');
      toast.error(message);
    },
  });
}

// === Skills ===
export function useSkills() {
  return useQuery({
    queryKey: ['skills'],
    queryFn: async () => {
      const response = await adminApi.getSkills();
      return response.data;
    },
  });
}

export function useCreateSkill() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateSkillRequest) => adminApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success(t('hk.skill.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.skill.createFailed'));
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSkillRequest }) =>
      adminApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success(t('hk.skill.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.skill.updateFailed'));
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success(t('hk.skill.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.skill.deleteFailed'));
    },
  });
}

export function useSkillEffects(skillId: string) {
  return useQuery({
    queryKey: ['skills', skillId, 'effects'],
    queryFn: async () => {
      const response = await adminApi.getSkillEffects(skillId);
      return response.data;
    },
    enabled: !!skillId,
  });
}

export function useSetSkillEffects() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ skillId, data }: { skillId: string; data: SetSkillEffectsRequest }) =>
      adminApi.setSkillEffects(skillId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['skills', variables.skillId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success(t('hk.skill.effectsUpdated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.skill.effectsUpdateFailed'));
    },
  });
}

// === Subclasses ===
export function useSubclasses() {
  return useQuery({
    queryKey: ['subclasses'],
    queryFn: async () => {
      const response = await adminApi.getSubclasses();
      return response.data;
    },
  });
}

export function useCreateSubclass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateSubclassRequest) => adminApi.createSubclass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success(t('hk.subclass.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.subclass.createFailed'));
    },
  });
}

export function useUpdateSubclass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSubclassRequest }) =>
      adminApi.updateSubclass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success(t('hk.subclass.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.subclass.updateFailed'));
    },
  });
}

export function useDeleteSubclass() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSubclass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success(t('hk.subclass.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.subclass.deleteFailed'));
    },
  });
}

// === Feats ===
export function useFeats() {
  return useQuery({
    queryKey: ['feats'],
    queryFn: async () => {
      const response = await adminApi.getFeats();
      return response.data;
    },
  });
}

export function useCreateFeat() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (data: CreateFeatRequest) => adminApi.createFeat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success(t('hk.feat.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.feat.createFailed'));
    },
  });
}

export function useUpdateFeat() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFeatRequest }) =>
      adminApi.updateFeat(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success(t('hk.feat.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.feat.updateFailed'));
    },
  });
}

export function useDeleteFeat() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteFeat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success(t('hk.feat.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.feat.deleteFailed'));
    },
  });
}

// === Level Rewards ===
export function useLevelRewards(classId: string) {
  return useQuery({
    queryKey: ['level-rewards', classId],
    queryFn: async () => {
      const response = await adminApi.getLevelRewards(classId);
      return response.data;
    },
    enabled: !!classId,
  });
}

export function useCreateLevelReward() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: CreateClassLevelRewardRequest }) =>
      adminApi.createLevelReward(classId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['level-rewards', variables.classId] });
      toast.success(t('hk.levelReward.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.levelReward.createFailed'));
    },
  });
}

export function useDeleteLevelReward() {
  const queryClient = useQueryClient();
  const t = useT();
  return useMutation({
    mutationFn: ({ classId, rewardEntryId }: { classId: string; rewardEntryId: string }) =>
      adminApi.deleteLevelReward(classId, rewardEntryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['level-rewards', variables.classId] });
      toast.success(t('hk.levelReward.deleted'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.levelReward.deleteFailed'));
    },
  });
}

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

// === Admin Teams (read-only) ===
