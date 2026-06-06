import api from './axios';
import type {
  ApiResponse,
  AvailableContentEntry,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ProficiencySkillResponse,
  SpellReferenceResponse,
  StatTypeResponse,
} from '@/types';

/**
 * Global (vanilla) reference data, used by template character creation
 * outside any campaign. Endpoints filter out homebrew on the backend.
 */
export const referenceApi = {
  getStatTypes: async (): Promise<ApiResponse<StatTypeResponse[]>> => {
    const response = await api.get<ApiResponse<StatTypeResponse[]>>('/reference/stat-types');
    return response.data;
  },

  getClasses: async (): Promise<ApiResponse<CharacterClassDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterClassDetailResponse[]>>('/reference/classes');
    return response.data;
  },

  getRaces: async (): Promise<ApiResponse<CharacterRaceDetailResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterRaceDetailResponse[]>>('/reference/races');
    return response.data;
  },

  getBackgrounds: async (): Promise<ApiResponse<BackgroundResponse[]>> => {
    const response = await api.get<ApiResponse<BackgroundResponse[]>>('/reference/backgrounds');
    return response.data;
  },

  getProficiencySkills: async (): Promise<ApiResponse<ProficiencySkillResponse[]>> => {
    const response = await api.get<ApiResponse<ProficiencySkillResponse[]>>('/reference/proficiency-skills');
    return response.data;
  },

  getSpells: async (classId?: string): Promise<ApiResponse<SpellReferenceResponse[]>> => {
    const response = await api.get<ApiResponse<SpellReferenceResponse[]>>('/reference/spells', {
      params: classId ? { classId } : undefined,
    });
    return response.data;
  },

  /**
   * Catalogue entries (id + name + source label) the wizard uses to render
   * picker cards. The wizard expects this shape, so we expose it directly.
   */
  getAvailableClasses: async (): Promise<ApiResponse<AvailableContentEntry[]>> => {
    const response = await api.get<ApiResponse<AvailableContentEntry[]>>('/reference/available/classes');
    return response.data;
  },

  getAvailableRaces: async (): Promise<ApiResponse<AvailableContentEntry[]>> => {
    const response = await api.get<ApiResponse<AvailableContentEntry[]>>('/reference/available/races');
    return response.data;
  },
};
