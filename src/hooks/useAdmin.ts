import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '@/api/admin.api';
import type { ApiError, CreateFeatDto, CreateSubclassDto, CreateSkillDto, CreateClassLevelRewardDto } from '@/types';
import { AxiosError } from 'axios';

// Stat Types
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
    mutationFn: (data: { name: string; description: string }) => adminApi.createStatType(data),
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
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
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

// Item Types
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
    mutationFn: (data: { name: string; description: string; slot: string }) =>
      adminApi.createItemType(data),
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
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string; slot: string } }) =>
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

// Character Classes
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
    mutationFn: (data: { name: string; description: string }) =>
      adminApi.createCharacterClass(data),
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
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
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

// Character Races
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
    mutationFn: (data: { name: string; description: string }) =>
      adminApi.createCharacterRace(data),
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
    mutationFn: ({ id, data }: { id: string; data: { name: string; description: string } }) =>
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

// Users (read-only)
export function useUsers() {
  return useQuery({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const response = await adminApi.getUsers();
      return response.data;
    },
  });
}

// Admin Teams (read-only)
export function useAdminTeams() {
  return useQuery({
    queryKey: ['admin-teams'],
    queryFn: async () => {
      const response = await adminApi.getTeams();
      return response.data;
    },
  });
}

// Feats
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
    mutationFn: (data: CreateFeatDto) => adminApi.createFeat(data),
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
    mutationFn: ({ id, data }: { id: string; data: CreateFeatDto }) =>
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

// Subclasses
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
    mutationFn: (data: CreateSubclassDto) => adminApi.createSubclass(data),
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
    mutationFn: ({ id, data }: { id: string; data: CreateSubclassDto }) =>
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

// Skills
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
    mutationFn: (data: CreateSkillDto) => adminApi.createSkill(data),
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
    mutationFn: ({ id, data }: { id: string; data: CreateSkillDto }) =>
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

// Class Level Rewards
export function useClassLevelRewards(classId?: string) {
  return useQuery({
    queryKey: ['class-level-rewards', classId],
    queryFn: async () => {
      const response = await adminApi.getClassLevelRewards(classId);
      return response.data;
    },
  });
}

export function useCreateClassLevelReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateClassLevelRewardDto) => adminApi.createClassLevelReward(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-level-rewards'] });
      toast.success('Class level reward created!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to create class level reward');
    },
  });
}

export function useDeleteClassLevelReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminApi.deleteClassLevelReward(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['class-level-rewards'] });
      toast.success('Class level reward deleted!');
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || 'Failed to delete class level reward');
    },
  });
}
