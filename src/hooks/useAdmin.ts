import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin.api';
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
  return useMutation({
    mutationFn: (data: CreateStatTypeRequest) => adminApi.createStatType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success('Stat type created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create stat type');
    },
  });
}

export function useUpdateStatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateStatTypeRequest }) =>
      adminApi.updateStatType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success('Stat type updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update stat type');
    },
  });
}

export function useDeleteStatType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteStatType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stat-types'] });
      toast.success('Stat type deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete stat type');
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
  return useMutation({
    mutationFn: (data: CreateItemTypeRequest) => adminApi.createItemType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success('Item type created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create item type');
    },
  });
}

export function useUpdateItemType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateItemTypeRequest }) =>
      adminApi.updateItemType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success('Item type updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update item type');
    },
  });
}

export function useDeleteItemType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteItemType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['item-types'] });
      toast.success('Item type deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete item type');
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
  return useMutation({
    mutationFn: (data: CreateCharacterClassRequest) => adminApi.createCharacterClass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success('Character class created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create character class');
    },
  });
}

export function useUpdateCharacterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCharacterClassRequest }) =>
      adminApi.updateCharacterClass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success('Character class updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update character class');
    },
  });
}

export function useDeleteCharacterClass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCharacterClass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-classes'] });
      toast.success('Character class deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Cannot delete: this class is in use by characters'
        : error.response?.data?.message || 'Failed to delete character class';
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
  return useMutation({
    mutationFn: (data: CreateCharacterRaceRequest) => adminApi.createCharacterRace(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success('Character race created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create character race');
    },
  });
}

export function useUpdateCharacterRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateCharacterRaceRequest }) =>
      adminApi.updateCharacterRace(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success('Character race updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update character race');
    },
  });
}

export function useDeleteCharacterRace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteCharacterRace(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['character-races'] });
      toast.success('Character race deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Cannot delete: this race is in use by characters'
        : error.response?.data?.message || 'Failed to delete character race';
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
  return useMutation({
    mutationFn: (data: CreateSkillRequest) => adminApi.createSkill(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create skill');
    },
  });
}

export function useUpdateSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSkillRequest }) =>
      adminApi.updateSkill(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update skill');
    },
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSkill(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete skill');
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
  return useMutation({
    mutationFn: ({ skillId, data }: { skillId: string; data: SetSkillEffectsRequest }) =>
      adminApi.setSkillEffects(skillId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['skills', variables.skillId, 'effects'] });
      queryClient.invalidateQueries({ queryKey: ['skills'] });
      toast.success('Skill effects updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update skill effects');
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
  return useMutation({
    mutationFn: (data: CreateSubclassRequest) => adminApi.createSubclass(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success('Subclass created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create subclass');
    },
  });
}

export function useUpdateSubclass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateSubclassRequest }) =>
      adminApi.updateSubclass(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success('Subclass updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update subclass');
    },
  });
}

export function useDeleteSubclass() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteSubclass(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subclasses'] });
      toast.success('Subclass deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete subclass');
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
  return useMutation({
    mutationFn: (data: CreateFeatRequest) => adminApi.createFeat(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success('Feat created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create feat');
    },
  });
}

export function useUpdateFeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateFeatRequest }) =>
      adminApi.updateFeat(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success('Feat updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update feat');
    },
  });
}

export function useDeleteFeat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteFeat(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feats'] });
      toast.success('Feat deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete feat');
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
  return useMutation({
    mutationFn: ({ classId, data }: { classId: string; data: CreateClassLevelRewardRequest }) =>
      adminApi.createLevelReward(classId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['level-rewards', variables.classId] });
      toast.success('Level reward created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create level reward');
    },
  });
}

export function useDeleteLevelReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ classId, rewardEntryId }: { classId: string; rewardEntryId: string }) =>
      adminApi.deleteLevelReward(classId, rewardEntryId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['level-rewards', variables.classId] });
      toast.success('Level reward deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete level reward');
    },
  });
}

// === Buffs / Debuffs ===
export function useBuffsDebuffs(params?: { isBuff?: boolean; effectType?: string }) {
  return useQuery({
    queryKey: ['buffs-debuffs', params],
    queryFn: async () => {
      const response = await adminApi.getBuffsDebuffs(params);
      return response.data;
    },
  });
}

export function useCreateBuffDebuff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateBuffDebuffRequest) => adminApi.createBuffDebuff(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success('Buff/Debuff created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create buff/debuff');
    },
  });
}

export function useUpdateBuffDebuff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateBuffDebuffRequest }) =>
      adminApi.updateBuffDebuff(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success('Buff/Debuff updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update buff/debuff');
    },
  });
}

export function useDeleteBuffDebuff() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteBuffDebuff(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['buffs-debuffs'] });
      toast.success('Buff/Debuff deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Cannot delete: this buff/debuff is in use'
        : error.response?.data?.message || 'Failed to delete buff/debuff';
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
  return useMutation({
    mutationFn: (data: CreateEnchantmentTypeRequest) => adminApi.createEnchantmentType(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success('Enchantment type created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create enchantment type');
    },
  });
}

export function useUpdateEnchantmentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: CreateEnchantmentTypeRequest }) =>
      adminApi.updateEnchantmentType(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success('Enchantment type updated!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to update enchantment type');
    },
  });
}

export function useDeleteEnchantmentType() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteEnchantmentType(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-enchantment-types'] });
      toast.success('Enchantment type deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      const status = error.response?.status;
      const message = status === 409
        ? 'Cannot delete: this enchantment type is in use'
        : error.response?.data?.message || 'Failed to delete enchantment type';
      toast.error(message);
    },
  });
}

// === Users (read-only, ADMIN) ===
export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await adminApi.getUsers();
      return response.data;
    },
  });
}

// === Admin Teams (read-only) ===
