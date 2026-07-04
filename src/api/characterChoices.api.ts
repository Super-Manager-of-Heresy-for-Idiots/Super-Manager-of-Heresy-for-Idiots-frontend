import api from './axios';
import type { ApiResponse } from '@/types';

/**
 * Feature choices for a character (Fighting Style, Expertise skills, Metamagic, …). List / select / remove.
 * Backend: /api/characters/{characterId}/features/choices. Empty unless the runtime is on and rules approved.
 */

export interface ChoiceOption {
  id: string;
  optionType: string;
  targetEntityId?: string | null;
  filterRuleId?: string | null;
}

export interface ChoiceSelection {
  id: string;
  optionType: string;
  targetEntityId?: string | null;
  chosenAtLevel?: number | null;
}

export interface FeatureChoiceGroup {
  groupId: string;
  featureId: string;
  choiceKey: string;
  minChoices: number;
  maxChoices: number;
  chosenCount: number;
  remaining: number;
  options: ChoiceOption[];
  selections: ChoiceSelection[];
}

const base = (characterId: string) => `/characters/${characterId}/features/choices`;

export const characterChoicesApi = {
  list: async (characterId: string): Promise<ApiResponse<FeatureChoiceGroup[]>> =>
    (await api.get<ApiResponse<FeatureChoiceGroup[]>>(base(characterId))).data,

  choose: async (
    characterId: string,
    groupId: string,
    optionType: string,
    targetEntityId?: string,
  ): Promise<ApiResponse<FeatureChoiceGroup>> =>
    (await api.post<ApiResponse<FeatureChoiceGroup>>(`${base(characterId)}/${groupId}`, null, {
      params: { optionType, targetEntityId },
    })).data,

  unchoose: async (characterId: string, choiceId: string): Promise<ApiResponse<void>> =>
    (await api.delete<ApiResponse<void>>(`${base(characterId)}/${choiceId}`)).data,
};
