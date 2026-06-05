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

export interface CreateFullCharacterRequest {
  campaignId: string;
  name: string;
  playerName?: string;
  alignment?: string;
  level: number;
  // backend reference ids (resolved from available content)
  classId: string;
  raceId: string;
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
  biography?: string;
  features?: string;
  proficiencies?: string;
}

export interface BasicCreateCharacterRequest {
  campaignId: string;
  name: string;
  classId: string;
  raceId: string;
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
};
