import api from './axios';
import type {
  ApiResponse,
  StatTypeResponse,
  ItemTypeResponse,
  CharacterRaceResponse,
  UserResponse,
  SkillResponse,
  FeatResponse,
  SubclassResponse,
  BuffDebuffResponse,
  EnchantmentTypeResponse,
  CreateStatTypeRequest,
  CreateItemTypeRequest,
  CreateCharacterRaceRequest,
  CreateSkillRequest,
  CreateFeatRequest,
  CreateSubclassRequest,
  CreateBuffDebuffRequest,
  CreateEnchantmentTypeRequest,
  SetSkillEffectsRequest,
  SkillEffectResponse,
  SpellWarningResponse,
  SpellResolutionRequest,
  SpellDetail,
  UpdateSpellRequest,
} from '@/types';

export const adminApi = {
  // === Stat Types ===
  getStatTypes: async (): Promise<ApiResponse<StatTypeResponse[]>> => {
    const response = await api.get<ApiResponse<StatTypeResponse[]>>('/admin/stat-types');
    return response.data;
  },
  createStatType: async (data: CreateStatTypeRequest): Promise<ApiResponse<StatTypeResponse>> => {
    const response = await api.post<ApiResponse<StatTypeResponse>>('/admin/stat-types', data);
    return response.data;
  },
  getStatType: async (id: string): Promise<ApiResponse<StatTypeResponse>> => {
    const response = await api.get<ApiResponse<StatTypeResponse>>(`/admin/stat-types/${id}`);
    return response.data;
  },
  updateStatType: async (id: string, data: CreateStatTypeRequest): Promise<ApiResponse<StatTypeResponse>> => {
    const response = await api.put<ApiResponse<StatTypeResponse>>(`/admin/stat-types/${id}`, data);
    return response.data;
  },
  deleteStatType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/stat-types/${id}`);
    return response.data;
  },

  // === Item Types ===
  getItemTypes: async (): Promise<ApiResponse<ItemTypeResponse[]>> => {
    const response = await api.get<ApiResponse<ItemTypeResponse[]>>('/admin/item-types');
    return response.data;
  },
  createItemType: async (data: CreateItemTypeRequest): Promise<ApiResponse<ItemTypeResponse>> => {
    const response = await api.post<ApiResponse<ItemTypeResponse>>('/admin/item-types', data);
    return response.data;
  },
  getItemType: async (id: string): Promise<ApiResponse<ItemTypeResponse>> => {
    const response = await api.get<ApiResponse<ItemTypeResponse>>(`/admin/item-types/${id}`);
    return response.data;
  },
  updateItemType: async (id: string, data: CreateItemTypeRequest): Promise<ApiResponse<ItemTypeResponse>> => {
    const response = await api.put<ApiResponse<ItemTypeResponse>>(`/admin/item-types/${id}`, data);
    return response.data;
  },
  deleteItemType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/item-types/${id}`);
    return response.data;
  },

  // Character classes are authored via the content model (class-builder + /reference/classes).

  // === Character Races ===
  getCharacterRaces: async (): Promise<ApiResponse<CharacterRaceResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterRaceResponse[]>>('/admin/character-races');
    return response.data;
  },
  createCharacterRace: async (data: CreateCharacterRaceRequest): Promise<ApiResponse<CharacterRaceResponse>> => {
    const response = await api.post<ApiResponse<CharacterRaceResponse>>('/admin/character-races', data);
    return response.data;
  },
  updateCharacterRace: async (id: string, data: CreateCharacterRaceRequest): Promise<ApiResponse<CharacterRaceResponse>> => {
    const response = await api.put<ApiResponse<CharacterRaceResponse>>(`/admin/character-races/${id}`, data);
    return response.data;
  },
  deleteCharacterRace: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/character-races/${id}`);
    return response.data;
  },

  // === Skills ===
  getSkills: async (): Promise<ApiResponse<SkillResponse[]>> => {
    const response = await api.get<ApiResponse<SkillResponse[]>>('/admin/skills');
    return response.data;
  },
  createSkill: async (data: CreateSkillRequest): Promise<ApiResponse<SkillResponse>> => {
    const response = await api.post<ApiResponse<SkillResponse>>('/admin/skills', data);
    return response.data;
  },
  getSkill: async (id: string): Promise<ApiResponse<SkillResponse>> => {
    const response = await api.get<ApiResponse<SkillResponse>>(`/admin/skills/${id}`);
    return response.data;
  },
  updateSkill: async (id: string, data: CreateSkillRequest): Promise<ApiResponse<SkillResponse>> => {
    const response = await api.put<ApiResponse<SkillResponse>>(`/admin/skills/${id}`, data);
    return response.data;
  },
  deleteSkill: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/skills/${id}`);
    return response.data;
  },

  // Skill Effects
  getSkillEffects: async (skillId: string): Promise<ApiResponse<SkillEffectResponse[]>> => {
    const response = await api.get<ApiResponse<SkillEffectResponse[]>>(`/admin/skills/${skillId}/effects`);
    return response.data;
  },
  setSkillEffects: async (skillId: string, data: SetSkillEffectsRequest): Promise<ApiResponse<SkillEffectResponse[]>> => {
    const response = await api.put<ApiResponse<SkillEffectResponse[]>>(`/admin/skills/${skillId}/effects`, data);
    return response.data;
  },

  // === Subclasses ===
  getSubclasses: async (): Promise<ApiResponse<SubclassResponse[]>> => {
    const response = await api.get<ApiResponse<SubclassResponse[]>>('/admin/subclasses');
    return response.data;
  },
  createSubclass: async (data: CreateSubclassRequest): Promise<ApiResponse<SubclassResponse>> => {
    const response = await api.post<ApiResponse<SubclassResponse>>('/admin/subclasses', data);
    return response.data;
  },
  getSubclass: async (id: string): Promise<ApiResponse<SubclassResponse>> => {
    const response = await api.get<ApiResponse<SubclassResponse>>(`/admin/subclasses/${id}`);
    return response.data;
  },
  updateSubclass: async (id: string, data: CreateSubclassRequest): Promise<ApiResponse<SubclassResponse>> => {
    const response = await api.put<ApiResponse<SubclassResponse>>(`/admin/subclasses/${id}`, data);
    return response.data;
  },
  deleteSubclass: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/subclasses/${id}`);
    return response.data;
  },

  // === Feats ===
  getFeats: async (): Promise<ApiResponse<FeatResponse[]>> => {
    const response = await api.get<ApiResponse<FeatResponse[]>>('/admin/feats');
    return response.data;
  },
  createFeat: async (data: CreateFeatRequest): Promise<ApiResponse<FeatResponse>> => {
    const response = await api.post<ApiResponse<FeatResponse>>('/admin/feats', data);
    return response.data;
  },
  getFeat: async (id: string): Promise<ApiResponse<FeatResponse>> => {
    const response = await api.get<ApiResponse<FeatResponse>>(`/admin/feats/${id}`);
    return response.data;
  },
  updateFeat: async (id: string, data: CreateFeatRequest): Promise<ApiResponse<FeatResponse>> => {
    const response = await api.put<ApiResponse<FeatResponse>>(`/admin/feats/${id}`, data);
    return response.data;
  },
  deleteFeat: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/feats/${id}`);
    return response.data;
  },

  // === Buffs / Debuffs ===
  getBuffsDebuffs: async (params?: { isBuff?: boolean; effectType?: string }): Promise<ApiResponse<BuffDebuffResponse[]>> => {
    const response = await api.get<ApiResponse<BuffDebuffResponse[]>>('/admin/buffs-debuffs', { params });
    return response.data;
  },
  createBuffDebuff: async (data: CreateBuffDebuffRequest): Promise<ApiResponse<BuffDebuffResponse>> => {
    const response = await api.post<ApiResponse<BuffDebuffResponse>>('/admin/buffs-debuffs', data);
    return response.data;
  },
  getBuffDebuff: async (id: string): Promise<ApiResponse<BuffDebuffResponse>> => {
    const response = await api.get<ApiResponse<BuffDebuffResponse>>(`/admin/buffs-debuffs/${id}`);
    return response.data;
  },
  updateBuffDebuff: async (id: string, data: CreateBuffDebuffRequest): Promise<ApiResponse<BuffDebuffResponse>> => {
    const response = await api.put<ApiResponse<BuffDebuffResponse>>(`/admin/buffs-debuffs/${id}`, data);
    return response.data;
  },
  deleteBuffDebuff: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/buffs-debuffs/${id}`);
    return response.data;
  },

  // === Enchantment Types ===
  getEnchantmentTypes: async (): Promise<ApiResponse<EnchantmentTypeResponse[]>> => {
    const response = await api.get<ApiResponse<EnchantmentTypeResponse[]>>('/admin/enchantment-types');
    return response.data;
  },
  createEnchantmentType: async (data: CreateEnchantmentTypeRequest): Promise<ApiResponse<EnchantmentTypeResponse>> => {
    const response = await api.post<ApiResponse<EnchantmentTypeResponse>>('/admin/enchantment-types', data);
    return response.data;
  },
  getEnchantmentType: async (id: string): Promise<ApiResponse<EnchantmentTypeResponse>> => {
    const response = await api.get<ApiResponse<EnchantmentTypeResponse>>(`/admin/enchantment-types/${id}`);
    return response.data;
  },
  updateEnchantmentType: async (id: string, data: CreateEnchantmentTypeRequest): Promise<ApiResponse<EnchantmentTypeResponse>> => {
    const response = await api.put<ApiResponse<EnchantmentTypeResponse>>(`/admin/enchantment-types/${id}`, data);
    return response.data;
  },
  deleteEnchantmentType: async (id: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/admin/enchantment-types/${id}`);
    return response.data;
  },

  // === Users (read-only, ADMIN) ===
  getUsers: async (): Promise<ApiResponse<UserResponse[]>> => {
    const response = await api.get<ApiResponse<UserResponse[]>>('/admin/users');
    return response.data;
  },

  // === Spell resolution review (data-quality) ===
  getSpellWarnings: async (lang: string): Promise<ApiResponse<SpellWarningResponse[]>> => {
    const response = await api.get<ApiResponse<SpellWarningResponse[]>>('/admin/content/spell-warnings', { params: { lang } });
    return response.data;
  },
  resolveSpell: async (id: string, data: SpellResolutionRequest, lang: string): Promise<ApiResponse<SpellWarningResponse>> => {
    const response = await api.patch<ApiResponse<SpellWarningResponse>>(`/admin/content/spells/${id}/resolution`, data, { params: { lang } });
    return response.data;
  },
  updateSpell: async (id: string, data: UpdateSpellRequest, lang: string): Promise<ApiResponse<SpellDetail>> => {
    const response = await api.put<ApiResponse<SpellDetail>>(`/admin/content/spells/${id}`, data, { params: { lang } });
    return response.data;
  },

};
