import api from './axios';
import { normalizeClassDetail } from '@/lib/contentAdapters';
import type {
  ApiResponse,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ContentLabel,
  ProficiencySkillResponse,
  SpellReferenceResponse,
  StatTypeResponse,
} from '@/types';

export interface ReferenceCurrencyType {
  id: string;
  name: string;
  abbreviation?: string;
  goldValue?: number;
}

/** Feat reference option (authoring dropdowns). */
export interface ReferenceFeatOption {
  id: string;
  slug?: string;
  name: string;
  prerequisiteText?: string;
}

/** Numeric-modifier key suggestion. */
export interface ReferenceModifierKey {
  key: string;
  label?: string;
  defaultUnit?: string;
}

/**
 * Global (vanilla) reference data, used by template character creation
 * outside any campaign. Endpoints filter out homebrew on the backend.
 *
 * Endpoint shape matches the campaign-scoped reference controller — no
 * `/available/` prefix; skills live at `/skills` and currencies at `/currencies`.
 */
export const referenceApi = {
  getStatTypes: async (): Promise<ApiResponse<StatTypeResponse[]>> => {
    const response = await api.get<ApiResponse<StatTypeResponse[]>>('/reference/stat-types');
    return response.data;
  },

  getClasses: async (): Promise<ApiResponse<CharacterClassDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterClassDetailResponse[]>>('/reference/classes');
    return {
      ...response.data,
      data: response.data.data?.map(normalizeClassDetail),
    };
  },

  getRaces: async (): Promise<ApiResponse<CharacterRaceDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterRaceDetailResponse[]>>('/reference/races');
    return response.data;
  },

  getBackgrounds: async (): Promise<ApiResponse<BackgroundResponse[]>> => {
    const response = await api.get<ApiResponse<BackgroundResponse[]>>('/reference/backgrounds');
    return response.data;
  },

  /** Backend exposes proficiency skills at `/reference/skills` (no `proficiency-` prefix). */
  getSkills: async (): Promise<ApiResponse<ProficiencySkillResponse[]>> => {
    const response = await api.get<ApiResponse<ProficiencySkillResponse[]>>('/reference/skills');
    return response.data;
  },

  /** Vanilla currencies (e.g. gold/silver/copper). */
  getCurrencies: async (): Promise<ApiResponse<ReferenceCurrencyType[]>> => {
    const response = await api.get<ApiResponse<ReferenceCurrencyType[]>>('/reference/currencies');
    return response.data;
  },

  getSpells: async (classId?: string): Promise<ApiResponse<SpellReferenceResponse[]>> => {
    const response = await api.get<ApiResponse<SpellReferenceResponse[]>>('/reference/spells', {
      params: classId ? { classId } : undefined,
    });
    return response.data;
  },

  /** Ability scores (ability_score) for authoring dropdowns. */
  getAbilities: async (): Promise<ApiResponse<ContentLabel[]>> => {
    const response = await api.get<ApiResponse<ContentLabel[]>>('/reference/abilities');
    return response.data;
  },

  /** Feat options (paginated/searchable) for authoring dropdowns. */
  getFeatOptions: async (query?: string): Promise<ApiResponse<ReferenceFeatOption[]>> => {
    const response = await api.get<ApiResponse<ReferenceFeatOption[]>>('/reference/feats', {
      params: query ? { query } : undefined,
    });
    return response.data;
  },

  /** Known numeric-modifier keys (suggestions; free text still allowed). */
  getModifierKeys: async (): Promise<ApiResponse<ReferenceModifierKey[]>> => {
    const response = await api.get<ApiResponse<ReferenceModifierKey[]>>('/reference/modifier-keys');
    return response.data;
  },
};
