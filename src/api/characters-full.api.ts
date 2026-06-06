import { AxiosError } from 'axios';
import api from './axios';
import type { ApiResponse, CharacterResponse } from '@/types';

// Full aggregate creation payload (see BACKEND_SPEC_CHARACTER_WIZARD.md §4).
// The backend endpoint may not exist yet; the hook falls back to the basic
// create endpoint when this returns 404/405/501.
export interface CreateFullCharacterAbility {
  ability: 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';
  base: number;
}

export interface CreateFullCharacterAbilityScore {
  statId: string;
  baseValue: number;
}

export interface CreateFullCharacterBiography {
  personalityTraits?: string;
  ideals?: string;
  bonds?: string;
  flaws?: string;
}

export interface CreateFullCharacterCoin {
  currencyTypeId: string;
  amount: number;
}

export interface CreateFullCharacterRequest {
  campaignId: string;
  name: string;
  playerName?: string;
  alignment?: string;
  level: number;
  // backend reference ids (resolved from available content)
  classId: string;
  raceId: string;
  // Race v2 — lineage chosen at creation, when race.lineageRequired === true.
  selectedLineageId?: string | null;
  // rich 5e selections, keyed by SRD keys (graceful no-op if backend ignores)
  raceKey?: string;
  subraceKey?: string;
  subraceId?: string;
  classKey?: string;
  backgroundKey?: string;
  backgroundId?: string;
  abilities?: CreateFullCharacterAbility[];
  abilityScores?: CreateFullCharacterAbilityScore[];
  scoreMethod?: string;
  skills?: string[];
  classSkills?: string[];
  chosenSkillProficiencyIds?: string[];
  backgroundSkills?: string[];
  cantrips?: string[];
  cantripIds?: string[];
  spells?: string[];
  spellIds?: string[];
  speed?: number;
  armorClass?: number;
  maxHp?: number;
  hitDice?: string;
  avatar?: string | null;
  // Personal-life record (Traits / Ideals / Bonds / Flaws) — persisted as an object.
  biography?: CreateFullCharacterBiography;
  // Starting wallet balances, resolved to backend currency ids.
  startingCoins?: CreateFullCharacterCoin[];
  features?: string;
  proficiencies?: string;
}

export interface BasicCreateCharacterRequest {
  campaignId: string;
  name: string;
  classId: string;
  raceId: string;
  selectedLineageId?: string | null;
}

const NOT_IMPLEMENTED_STATUSES = new Set([404, 405, 501]);

export function isEndpointMissing(error: unknown): boolean {
  const status = (error as AxiosError)?.response?.status;
  return status !== undefined && NOT_IMPLEMENTED_STATUSES.has(status);
}

export const charactersFullApi = {
  /** Aggregate creation through the rich wizard payload. */
  createFull: async (
    campaignId: string,
    data: CreateFullCharacterRequest,
  ): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(
      `/campaigns/${campaignId}/characters/full`,
      data,
    );
    return response.data;
  },

  /** Existing minimal endpoint — used as a fallback today. */
  createBasic: async (
    campaignId: string,
    data: BasicCreateCharacterRequest,
  ): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(
      `/campaigns/${campaignId}/characters`,
      data,
    );
    return response.data;
  },

  // ── Templates (character without campaign) ────────────────

  /** Create a vanilla character template (no campaign attached). */
  createTemplate: async (
    data: CreateFullCharacterRequest,
  ): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.post<ApiResponse<CharacterResponse>>(
      `/characters/full`,
      data,
    );
    return response.data;
  },

  /** List the current user's character templates. */
  listMyTemplates: async (): Promise<ApiResponse<CharacterResponse[]>> => {
    const response = await api.get<ApiResponse<CharacterResponse[]>>(`/characters/my`);
    return response.data;
  },

  /** Get a single template by id. */
  getTemplate: async (templateId: string): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.get<ApiResponse<CharacterResponse>>(`/characters/${templateId}`);
    return response.data;
  },

  /** Delete a template. */
  deleteTemplate: async (templateId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/characters/${templateId}`);
    return response.data;
  },

  /**
   * Bring a template into a campaign.
   * When `mode === 'clone'`, the original template stays available for re-use.
   * When `mode === 'move'`, the backend is asked (via `?clone=false`) to attach
   * the original record itself; servers that don't implement the flag will
   * fall back to a clone.
   */
  fromTemplate: async (
    campaignId: string,
    templateId: string,
    mode: 'clone' | 'move' = 'clone',
  ): Promise<ApiResponse<CharacterResponse>> => {
    const params = mode === 'move' ? { clone: false } : undefined;
    const response = await api.post<ApiResponse<CharacterResponse>>(
      `/campaigns/${campaignId}/characters/from-template/${templateId}`,
      {},
      { params },
    );
    return response.data;
  },
};
