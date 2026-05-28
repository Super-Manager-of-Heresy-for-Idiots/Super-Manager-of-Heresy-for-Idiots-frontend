import api from './axios';
import type {
  ApiResponse,
  StatType,
  ItemType,
  CharacterClass,
  CharacterRace,
  User,
  Team,
  Feat,
  Subclass,
  Skill,
  ClassLevelReward,
  CreateFeatDto,
  CreateSubclassDto,
  CreateSkillDto,
  CreateClassLevelRewardDto,
} from '@/types';

export const adminApi = {
  // Stat Types
  getStatTypes: async (): Promise<ApiResponse<StatType[]>> => {
    const response = await api.get<ApiResponse<StatType[]>>('/admin/stat-types');
    return response.data;
  },
  createStatType: async (data: { name: string; description: string }): Promise<ApiResponse<StatType>> => {
    const response = await api.post<ApiResponse<StatType>>('/admin/stat-types', data);
    return response.data;
  },
  updateStatType: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<StatType>> => {
    const response = await api.put<ApiResponse<StatType>>(`/admin/stat-types/${id}`, data);
    return response.data;
  },
  deleteStatType: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/stat-types/${id}`);
    return response.data;
  },

  // Item Types
  getItemTypes: async (): Promise<ApiResponse<ItemType[]>> => {
    const response = await api.get<ApiResponse<ItemType[]>>('/admin/item-types');
    return response.data;
  },
  createItemType: async (data: { name: string; description: string; slot: string }): Promise<ApiResponse<ItemType>> => {
    const response = await api.post<ApiResponse<ItemType>>('/admin/item-types', data);
    return response.data;
  },
  updateItemType: async (id: string, data: { name: string; description: string; slot: string }): Promise<ApiResponse<ItemType>> => {
    const response = await api.put<ApiResponse<ItemType>>(`/admin/item-types/${id}`, data);
    return response.data;
  },
  deleteItemType: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/item-types/${id}`);
    return response.data;
  },

  // Character Classes
  getCharacterClasses: async (): Promise<ApiResponse<CharacterClass[]>> => {
    const response = await api.get<ApiResponse<CharacterClass[]>>('/admin/character-classes');
    return response.data;
  },
  createCharacterClass: async (data: { name: string; description: string }): Promise<ApiResponse<CharacterClass>> => {
    const response = await api.post<ApiResponse<CharacterClass>>('/admin/character-classes', data);
    return response.data;
  },
  updateCharacterClass: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<CharacterClass>> => {
    const response = await api.put<ApiResponse<CharacterClass>>(`/admin/character-classes/${id}`, data);
    return response.data;
  },
  deleteCharacterClass: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/character-classes/${id}`);
    return response.data;
  },

  // Character Races
  getCharacterRaces: async (): Promise<ApiResponse<CharacterRace[]>> => {
    const response = await api.get<ApiResponse<CharacterRace[]>>('/admin/character-races');
    return response.data;
  },
  createCharacterRace: async (data: { name: string; description: string }): Promise<ApiResponse<CharacterRace>> => {
    const response = await api.post<ApiResponse<CharacterRace>>('/admin/character-races', data);
    return response.data;
  },
  updateCharacterRace: async (id: string, data: { name: string; description: string }): Promise<ApiResponse<CharacterRace>> => {
    const response = await api.put<ApiResponse<CharacterRace>>(`/admin/character-races/${id}`, data);
    return response.data;
  },
  deleteCharacterRace: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/character-races/${id}`);
    return response.data;
  },

  // Users (read-only)
  getUsers: async (): Promise<ApiResponse<User[]>> => {
    const response = await api.get<ApiResponse<User[]>>('/admin/users');
    return response.data;
  },

  // Teams (read-only)
  getTeams: async (): Promise<ApiResponse<Team[]>> => {
    const response = await api.get<ApiResponse<Team[]>>('/admin/teams');
    return response.data;
  },

  // Feats
  getFeats: async (): Promise<ApiResponse<Feat[]>> => {
    const response = await api.get<ApiResponse<Feat[]>>('/admin/feats');
    return response.data;
  },
  createFeat: async (data: CreateFeatDto): Promise<ApiResponse<Feat>> => {
    const response = await api.post<ApiResponse<Feat>>('/admin/feats', data);
    return response.data;
  },
  updateFeat: async (id: string, data: CreateFeatDto): Promise<ApiResponse<Feat>> => {
    const response = await api.put<ApiResponse<Feat>>(`/admin/feats/${id}`, data);
    return response.data;
  },
  deleteFeat: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/feats/${id}`);
    return response.data;
  },

  // Subclasses
  getSubclasses: async (): Promise<ApiResponse<Subclass[]>> => {
    const response = await api.get<ApiResponse<Subclass[]>>('/admin/subclasses');
    return response.data;
  },
  createSubclass: async (data: CreateSubclassDto): Promise<ApiResponse<Subclass>> => {
    const response = await api.post<ApiResponse<Subclass>>('/admin/subclasses', data);
    return response.data;
  },
  updateSubclass: async (id: string, data: CreateSubclassDto): Promise<ApiResponse<Subclass>> => {
    const response = await api.put<ApiResponse<Subclass>>(`/admin/subclasses/${id}`, data);
    return response.data;
  },
  deleteSubclass: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/subclasses/${id}`);
    return response.data;
  },

  // Skills
  getSkills: async (): Promise<ApiResponse<Skill[]>> => {
    const response = await api.get<ApiResponse<Skill[]>>('/admin/skills');
    return response.data;
  },
  createSkill: async (data: CreateSkillDto): Promise<ApiResponse<Skill>> => {
    const response = await api.post<ApiResponse<Skill>>('/admin/skills', data);
    return response.data;
  },
  updateSkill: async (id: string, data: CreateSkillDto): Promise<ApiResponse<Skill>> => {
    const response = await api.put<ApiResponse<Skill>>(`/admin/skills/${id}`, data);
    return response.data;
  },
  deleteSkill: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/skills/${id}`);
    return response.data;
  },

  // Class Level Rewards
  getClassLevelRewards: async (classId?: string): Promise<ApiResponse<ClassLevelReward[]>> => {
    const url = classId ? `/admin/class-level-rewards?classId=${classId}` : '/admin/class-level-rewards';
    const response = await api.get<ApiResponse<ClassLevelReward[]>>(url);
    return response.data;
  },
  createClassLevelReward: async (data: CreateClassLevelRewardDto): Promise<ApiResponse<ClassLevelReward>> => {
    const response = await api.post<ApiResponse<ClassLevelReward>>('/admin/class-level-rewards', data);
    return response.data;
  },
  deleteClassLevelReward: async (id: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/admin/class-level-rewards/${id}`);
    return response.data;
  },
};
