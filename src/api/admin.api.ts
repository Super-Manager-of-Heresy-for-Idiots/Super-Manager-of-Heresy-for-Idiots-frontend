import api from './axios';
import type {
  ApiResponse,
  StatTypeResponse,
  UserResponse,
  BuffDebuffResponse,
  EnchantmentTypeResponse,
  CreateStatTypeRequest,
  CreateBuffDebuffRequest,
  CreateEnchantmentTypeRequest,
  SpellWarningResponse,
  SpellResolutionRequest,
  ClassFeatureWarningResponse,
  ClassFeatureResolutionRequest,
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

  // Character classes, subclasses, features and rewards are authored through
  // classAuthoringApi on the normalized content model. Standalone legacy admin
  // CRUD for races/species, skills, subclasses and feats is no longer exposed
  // from active frontend surfaces.

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
  getClassFeatureWarnings: async (lang: string): Promise<ApiResponse<ClassFeatureWarningResponse[]>> => {
    const response = await api.get<ApiResponse<ClassFeatureWarningResponse[]>>('/admin/content/class-feature-warnings', { params: { lang } });
    return response.data;
  },
  resolveClassFeature: async (id: string, data: ClassFeatureResolutionRequest, lang: string): Promise<ApiResponse<ClassFeatureWarningResponse>> => {
    const response = await api.patch<ApiResponse<ClassFeatureWarningResponse>>(`/admin/content/class-features/${id}/resolution`, data, { params: { lang } });
    return response.data;
  },
  updateSpell: async (id: string, data: UpdateSpellRequest, lang: string): Promise<ApiResponse<SpellDetail>> => {
    const response = await api.put<ApiResponse<SpellDetail>>(`/admin/content/spells/${id}`, data, { params: { lang } });
    return response.data;
  },

  // === Spell ↔ buff/debuff links ===
  getSpellBuffs: async (id: string): Promise<ApiResponse<BuffDebuffResponse[]>> => {
    const response = await api.get<ApiResponse<BuffDebuffResponse[]>>(`/admin/content/spells/${id}/buffs`);
    return response.data;
  },
  setSpellBuffs: async (id: string, buffDebuffIds: string[]): Promise<ApiResponse<BuffDebuffResponse[]>> => {
    const response = await api.put<ApiResponse<BuffDebuffResponse[]>>(`/admin/content/spells/${id}/buffs`, { buffDebuffIds });
    return response.data;
  },

};
