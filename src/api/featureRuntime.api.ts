import api from './axios';
import type { ApiResponse } from '@/types';

/**
 * Player/GM-facing feature-rules runtime for a character: resource counters and active effects.
 * Backend: /api/characters/{characterId}/features/*. These return empty unless the feature-rules
 * runtime is enabled (app.feature-rules.*) and rules are approved, so panels degrade to nothing.
 */

export interface FeatureResource {
  id: string;
  resourceDefinitionId: string;
  resourceKey: string;
  displayName: string;
  currentValue: number;
  maxValue: number;
  sharedPoolKey?: string | null;
  allowNegative: boolean;
  lastResetAt?: string | null;
}

export interface PendingPrompt {
  id: string;
  combatId?: string | null;
  sourceFeatureId?: string | null;
  featureTriggerId?: string | null;
  triggerEventId?: string | null;
  promptType?: string | null;
  status: string;
  expiresAt?: string | null;
  createdAt?: string | null;
}

export interface FeatureAction {
  featureId: string;
  featureName: string;
  featureRuleId?: string | null;
  actionType?: string | null;
  actionTypeLabel?: string | null;
  resourceDefinitionId?: string | null;
  resourceKey?: string | null;
  resourceCost?: number | null;
  resourceRemaining?: number | null;
  available: boolean;
  unavailableReason?: string | null;
  requiresTarget: boolean;
  requiresConfirmation: boolean;
}

export interface FeatureEffect {
  id: string;
  effectDefinitionId?: string | null;
  effectKey: string;
  displayName: string;
  sourceFeatureId?: string | null;
  sourceCharacterId?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  remainingRounds?: number | null;
  status: string;
  concentrationRequired: boolean;
  stackingPolicy?: string | null;
  activeEffectGroup?: string | null;
}

export const featureRuntimeApi = {
  listResources: async (characterId: string): Promise<ApiResponse<FeatureResource[]>> => {
    const response = await api.get<ApiResponse<FeatureResource[]>>(
      `/characters/${characterId}/features/resources`,
    );
    return response.data;
  },

  spendResource: async (
    characterId: string,
    resourceId: string,
    amount: number,
  ): Promise<ApiResponse<FeatureResource>> => {
    const response = await api.post<ApiResponse<FeatureResource>>(
      `/characters/${characterId}/features/resources/${resourceId}/spend`,
      null,
      { params: { amount } },
    );
    return response.data;
  },

  adjustResource: async (
    characterId: string,
    resourceId: string,
    value: number,
  ): Promise<ApiResponse<FeatureResource>> => {
    const response = await api.post<ApiResponse<FeatureResource>>(
      `/characters/${characterId}/features/resources/${resourceId}/adjust`,
      null,
      { params: { value } },
    );
    return response.data;
  },

  listEffects: async (characterId: string): Promise<ApiResponse<FeatureEffect[]>> => {
    const response = await api.get<ApiResponse<FeatureEffect[]>>(
      `/characters/${characterId}/features/effects`,
    );
    return response.data;
  },

  endEffect: async (characterId: string, effectId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(
      `/characters/${characterId}/features/effects/${effectId}/end`,
    );
    return response.data;
  },

  listActions: async (characterId: string): Promise<ApiResponse<FeatureAction[]>> => {
    const response = await api.get<ApiResponse<FeatureAction[]>>(
      `/characters/${characterId}/features/actions`,
    );
    return response.data;
  },

  useFeature: async (
    characterId: string,
    featureId: string,
    combatId?: string,
  ): Promise<ApiResponse<unknown>> => {
    // Passing combatId (in a battle) makes the backend spend the feature's action-economy slot;
    // out of combat it is omitted. The in-combat call site is the deferred battle feature UI (Phase 5).
    const response = await api.post<ApiResponse<unknown>>(
      `/characters/${characterId}/features/${featureId}/use`,
      combatId ? { combatId } : undefined,
    );
    return response.data;
  },

  listPendingPrompts: async (characterId: string): Promise<ApiResponse<PendingPrompt[]>> => {
    const response = await api.get<ApiResponse<PendingPrompt[]>>(
      `/characters/${characterId}/features/pending-prompts`,
    );
    return response.data;
  },

  resolvePrompt: async (characterId: string, promptId: string): Promise<ApiResponse<PendingPrompt>> => {
    const response = await api.post<ApiResponse<PendingPrompt>>(
      `/characters/${characterId}/features/pending-prompts/${promptId}/resolve`,
    );
    return response.data;
  },

  declinePrompt: async (characterId: string, promptId: string): Promise<ApiResponse<PendingPrompt>> => {
    const response = await api.post<ApiResponse<PendingPrompt>>(
      `/characters/${characterId}/features/pending-prompts/${promptId}/decline`,
    );
    return response.data;
  },
};
