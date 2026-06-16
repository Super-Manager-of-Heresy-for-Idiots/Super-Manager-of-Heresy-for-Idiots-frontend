import api from './axios';
import { normalizeClassDetail } from '@/lib/contentAdapters';
import type {
  ApiResponse,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
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
};
