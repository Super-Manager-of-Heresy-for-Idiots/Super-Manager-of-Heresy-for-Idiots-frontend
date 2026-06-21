import api from './axios';
import type {
  ApiResponse,
  CharacterResponse,
  ContentLevelUpRequest,
  UpdateCharacterRequest,
} from '@/types';

// Wizard state payload. The API layer maps this UI-rich shape to the backend
// CreateContentCharacterRequest before sending it.
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

export interface CreateFullCharacterAttack {
  name: string;
  attackBonus: string;
  damage: string;
  damageType: string;
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
  classId: string;
  raceId: string;
  selectedLineageId?: string | null;
  raceKey?: string;
  subraceKey?: string;
  subraceId?: string;
  classKey?: string;
  backgroundKey?: string;
  backgroundId: string;
  abilities?: CreateFullCharacterAbility[];
  abilityScores?: CreateFullCharacterAbilityScore[];
  scoreMethod?: string;
  skills?: string[];
  classSkills?: string[];
  chosenSkillIds?: string[];
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
  biography?: CreateFullCharacterBiography;
  startingCoins?: CreateFullCharacterCoin[];
  initialRewardSelections?: ContentLevelUpRequest['selections'];
  features?: string;
  proficiencies?: string;
  equipment?: string;
  attacks?: CreateFullCharacterAttack[];
}

export type CreateTemplateCharacterRequest = Omit<CreateFullCharacterRequest, 'campaignId'>;

export interface CreateContentCharacterRequest {
  name: string;
  playerName?: string;
  classId: string;
  raceId: string;
  selectedLineageId?: string | null;
  backgroundId: string;
  level: number;
  abilityScores: CreateFullCharacterAbilityScore[];
  scoreMethod: string;
  chosenSkillIds?: string[];
  cantripIds?: string[];
  spellIds?: string[];
  startingCoins?: CreateFullCharacterCoin[];
  initialRewardSelections?: ContentLevelUpRequest['selections'];
  // Character-sheet narrative / combat fields persisted on the character.
  alignment?: string;
  avatarUrl?: string;
  proficiencies?: string;
  equipment?: string;
  features?: string;
  biography?: CreateFullCharacterBiography;
  attacks?: CreateFullCharacterAttack[];
}

export interface ContentCharacterCreationResponse {
  id: string;
  name: string;
  classId: string;
  totalLevel: number;
  campaignId?: string | null;
  skillProficiencyIds?: string[];
  knownSpellIds?: string[];
}

function nonEmptyIds(ids?: string[]): string[] | undefined {
  const filtered = (ids ?? []).filter(Boolean);
  return filtered.length ? filtered : undefined;
}

function trimToUndefined(value?: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

// Drop attacks that carry no data at all so we never persist blank rows.
function cleanAttacks(
  attacks?: CreateFullCharacterAttack[],
): CreateFullCharacterAttack[] | undefined {
  const filtered = (attacks ?? []).filter(
    (a) => a && (a.name?.trim() || a.attackBonus?.trim() || a.damage?.trim() || a.damageType?.trim()),
  );
  return filtered.length ? filtered : undefined;
}

function toContentCharacterRequest(
  data: CreateFullCharacterRequest | CreateTemplateCharacterRequest,
): CreateContentCharacterRequest {
  return {
    name: data.name,
    playerName: data.playerName,
    classId: data.classId,
    raceId: data.raceId,
    selectedLineageId: data.selectedLineageId ?? null,
    backgroundId: data.backgroundId,
    level: data.level,
    abilityScores: data.abilityScores ?? [],
    scoreMethod: data.scoreMethod ?? 'STANDARD_ARRAY',
    chosenSkillIds: nonEmptyIds(data.chosenSkillIds),
    cantripIds: nonEmptyIds(data.cantripIds),
    spellIds: nonEmptyIds(data.spellIds),
    startingCoins: data.startingCoins,
    initialRewardSelections: data.initialRewardSelections?.length ? data.initialRewardSelections : undefined,
    // Carry the character-sheet narrative / combat fields through to the backend.
    alignment: trimToUndefined(data.alignment),
    avatarUrl: trimToUndefined(data.avatar),
    proficiencies: trimToUndefined(data.proficiencies),
    equipment: trimToUndefined(data.equipment),
    features: trimToUndefined(data.features),
    biography: data.biography,
    attacks: cleanAttacks(data.attacks),
  };
}

export const charactersFullApi = {
  /** Create a campaign character through the new content-model payload. */
  createFull: async (
    campaignId: string,
    data: CreateFullCharacterRequest,
  ): Promise<ApiResponse<ContentCharacterCreationResponse>> => {
    const response = await api.post<ApiResponse<ContentCharacterCreationResponse>>(
      `/campaigns/${campaignId}/characters/full`,
      toContentCharacterRequest(data),
    );
    return response.data;
  },

  /** Create a vanilla character template through the new content-model payload. */
  createTemplate: async (
    data: CreateTemplateCharacterRequest,
  ): Promise<ApiResponse<ContentCharacterCreationResponse>> => {
    const response = await api.post<ApiResponse<ContentCharacterCreationResponse>>(
      `/characters/full`,
      toContentCharacterRequest(data),
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

  /** Partial update for a template (mirrors the campaign PUT semantics). */
  updateTemplate: async (
    templateId: string,
    data: UpdateCharacterRequest,
  ): Promise<ApiResponse<CharacterResponse>> => {
    const response = await api.put<ApiResponse<CharacterResponse>>(
      `/characters/${templateId}`,
      data,
    );
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
