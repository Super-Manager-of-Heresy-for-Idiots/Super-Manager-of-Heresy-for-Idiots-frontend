import api from './axios';
import { contentCatalogApi } from './content-catalog.api';
import {
  backgroundDetailToResponse,
  normalizeClassDetail,
  speciesDetailToRaceResponse,
  spellDetailToReference,
} from '@/lib/contentAdapters';
import type {
  ApiResponse,
  BackgroundResponse,
  CharacterClassDetailResponse,
  CharacterRaceDetailResponse,
  ContentLabel,
  ProficiencySkillResponse,
  SpeciesDetail,
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

  /**
   * Races now come from the normalized content model as Species (2024). The legacy
   * `/reference/races` route was removed (Phase S5) in favor of `/reference/species`.
   * Mapped back to the wizard's lightweight CharacterRaceDetailResponse.
   */
  getRaces: async (): Promise<ApiResponse<CharacterRaceDetailResponse[]>> => {
    const response = await api.get<ApiResponse<SpeciesDetail[]>>('/reference/species');
    return {
      ...response.data,
      data: response.data.data?.map(speciesDetailToRaceResponse),
    };
  },

  getSpecies: async (): Promise<ApiResponse<SpeciesDetail[]>> => {
    const response = await api.get<ApiResponse<SpeciesDetail[]>>('/reference/species');
    return response.data;
  },

  /**
   * Backgrounds now come from the normalized content model (Content Catalog);
   * the legacy `/reference/backgrounds` shape was superseded. Mapped back to the
   * wizard's lightweight BackgroundResponse.
   */
  getBackgrounds: async (): Promise<ApiResponse<BackgroundResponse[]>> => {
    const response = await contentCatalogApi.backgrounds.list();
    return { ...response, data: (response.data ?? []).map(backgroundDetailToResponse) };
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

  /**
   * Spells come from the normalized content model (Content Catalog). The `classId`
   * filter is applied client-side via the flattened class availability, since the
   * catalog list endpoint is unfiltered.
   */
  getSpells: async (classId?: string): Promise<ApiResponse<SpellReferenceResponse[]>> => {
    const response = await contentCatalogApi.spells.list();
    const mapped = (response.data ?? []).map(spellDetailToReference);
    return {
      ...response,
      data: classId ? mapped.filter((s) => s.availableToClassIds?.includes(classId)) : mapped,
    };
  },

  /** Ability scores (ability_score) for authoring dropdowns. */
  getAbilities: async (): Promise<ApiResponse<ContentLabel[]>> => {
    const response = await api.get<ApiResponse<ContentLabel[]>>('/reference/abilities');
    return response.data;
  },

  /** Damage types (damage_type) for spell/item authoring dropdowns. */
  getDamageTypes: async (): Promise<ApiResponse<ContentLabel[]>> => {
    const response = await api.get<ApiResponse<ContentLabel[]>>('/reference/damage-types');
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
