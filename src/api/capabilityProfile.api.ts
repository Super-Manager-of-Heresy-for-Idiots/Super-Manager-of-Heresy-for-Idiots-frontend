import api from './axios';
import type { ApiResponse } from '@/types';

/**
 * Class-aware capability profile for a character — the single read the UI uses to decide which
 * panels/tabs to render (see workspace docs/FEATURE_RULES_FRONTEND_REWORK_PLAN.md §0).
 * The `spellcasting` block is always populated from class content; the feature-rules presence flags
 * are only true when the matching `app.feature-rules.*` subsystem is active on the backend.
 */
export interface SpellcastingCapability {
  /** True if any of the character's classes is a spellcaster. */
  caster: boolean;
  /** FULL | HALF | MULTI | NONE (THIRD/PACT are reported as FULL/HALF until content is enriched). */
  casterType: string;
  hasCantrips: boolean;
  abilityId?: string | null;
  abilityNameRu?: string | null;
  abilityNameEn?: string | null;
  spellSaveDc?: number | null;
  spellAttackBonus?: number | null;
  /** PREPARED | KNOWN | null (from class content). */
  preparation?: string | null;
  usesSpellbook?: boolean;
  ritual?: boolean;
}

export interface WildShapeCapability {
  /** True if the class has a form-granting feature (show the panel even before a form is learned). */
  canWildShape: boolean;
  knownFormCount: number;
  activeTransformation: boolean;
}

export interface AttunementCapability {
  used: number;
  max: number;
}

export interface ClassCapability {
  classId: string;
  classNameRu?: string | null;
  classNameEn?: string | null;
  classLevel?: number | null;
  caster: boolean;
  casterType: string;
}

export interface CapabilityProfile {
  characterId: string;
  totalLevel: number;
  proficiencyBonus: number;
  runtimeEnabled: boolean;
  spellcasting: SpellcastingCapability;
  classes: ClassCapability[];
  hasFeatureResources: boolean;
  hasFeatureActions: boolean;
  hasActiveEffects: boolean;
  hasCompanions: boolean;
  hasFeatureSpellGrants: boolean;
  hasItemAbilities: boolean;
  attunement?: AttunementCapability | null;
  wildShape?: WildShapeCapability | null;
  pendingChoices: number;
  pendingPrompts: number;
}

/** A structured class feature the character actually has (Reckless Attack, Wild Shape, …). */
export interface CharacterClassFeature {
  id: string;
  classId?: string | null;
  className?: string | null;
  level?: number | null;
  title: string;
  description?: string | null;
  activationType?: string | null;
}

export const capabilityProfileApi = {
  get: async (characterId: string): Promise<ApiResponse<CapabilityProfile>> => {
    const response = await api.get<ApiResponse<CapabilityProfile>>(
      `/characters/${characterId}/capability-profile`,
    );
    return response.data;
  },

  getClassFeatures: async (characterId: string): Promise<ApiResponse<CharacterClassFeature[]>> => {
    const response = await api.get<ApiResponse<CharacterClassFeature[]>>(
      `/characters/${characterId}/class-features`,
    );
    return response.data;
  },
};
