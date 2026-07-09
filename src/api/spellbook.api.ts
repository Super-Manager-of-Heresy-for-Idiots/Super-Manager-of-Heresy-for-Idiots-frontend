import api from './axios';
import type { ApiResponse, CharacterKnownSpell } from '@/types';

/** One damage line of a spell's execution plan (preview). */
export interface SpellPlanDamage {
  diceExpression?: string | null;
  flatAmount?: number | null;
  requiresAttackHit?: boolean;
  requiresSave?: boolean;
  halfOnSave?: boolean;
  saveDc?: number | null;
}

/** One healing line of a spell's execution plan (preview). */
export interface SpellPlanHealing {
  amount?: number | null;
  tempHp?: boolean;
}

/** Structured resolution a spell would produce (preview) — from the feature-rules runtime. */
export interface SpellPlan {
  featureName?: string;
  requiresManualAdjudication?: boolean;
  damages?: SpellPlanDamage[] | null;
  healings?: SpellPlanHealing[] | null;
}

/**
 * Character spellbook management (record/forget known spells) — the folio's missing spell management.
 * Backend: /api/characters/{characterId}/spellbook. Access enforced server-side (owner/GM/ADMIN).
 */
export const spellbookApi = {
  list: async (characterId: string): Promise<ApiResponse<CharacterKnownSpell[]>> => {
    const response = await api.get<ApiResponse<CharacterKnownSpell[]>>(
      `/characters/${characterId}/spellbook`,
    );
    return response.data;
  },

  learn: async (characterId: string, spellId: string): Promise<ApiResponse<CharacterKnownSpell>> => {
    const response = await api.post<ApiResponse<CharacterKnownSpell>>(
      `/characters/${characterId}/spellbook`,
      null,
      { params: { spellId } },
    );
    return response.data;
  },

  forget: async (characterId: string, spellId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(
      `/characters/${characterId}/spellbook/${spellId}`,
    );
    return response.data;
  },

  /** Preview a spell's roll plan (damage dice / DC / healing) WITHOUT casting or spending anything. */
  plan: async (characterId: string, spellId: string, slotLevel?: number): Promise<ApiResponse<SpellPlan>> => {
    const response = await api.get<ApiResponse<SpellPlan>>(
      `/characters/${characterId}/spellbook/${spellId}/plan`,
      slotLevel != null ? { params: { slotLevel } } : undefined,
    );
    return response.data;
  },
};
