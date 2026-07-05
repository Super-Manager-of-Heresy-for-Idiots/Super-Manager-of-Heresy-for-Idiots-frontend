import api from './axios';
import type {
  ApiResponse,
  CreateFeatureRuleIssueRequest,
  CreateFeatureRuleRequest,
  FeatureRuleDetail,
  FeatureRuleIssueResponse,
  FeatureRuleMetadata,
  FeatureRuleResponse,
  FeatureRuleRevisionResponse,
  FeatureRuleValidationResponse,
  FeatureFormulaEvaluateRequest,
  FeatureFormulaEvaluateResult,
  FeatureFormulaValidateRequest,
  FeatureFormulaValidation,
  ProblemFeatureSummary,
  RevisionActionRequest,
  RuleSourceOption,
  RulesetOption,
  UpdateFeatureRuleRequest,
} from '@/types';

/** Filters for the "problem features" triage list. */
export interface ProblemFeatureFilters {
  classId?: string;
  level?: number;
  ruleType?: string;
  reviewStatus?: string;
  severity?: string;
}

/** Filters for the global issue list. */
export interface IssueFilters {
  severity?: string;
  resolved?: boolean;
  classId?: string;
}

/** Coverage of the runtime features by the feature-rules model (Stage 12). */
export interface FeatureRuleCoverage {
  runtimeFeatures: number;
  featuresWithRules: number;
  featuresWithApprovedRules: number;
  featuresWithoutRules: number;
  featuresWithUnresolvedError: number;
  totalRules: number;
  approvedRules: number;
  needsReviewRules: number;
  rulesByType: Record<string, number>;
  rulesByStatus: Record<string, number>;
  coverageByClass: Record<string, number>;
}

export interface FeatureRuleBackfillResult {
  applied: boolean;
  runtimeFeatures: number;
  featuresTouched: number;
  featuresSkipped: number;
  rulesCreated: number;
  issuesCreated: number;
  formulasCreated: number;
}

/** A RESOURCE rule's definition for the admin editor. */
export interface ResourceDefinitionAdmin {
  id?: string | null;
  featureRuleId?: string | null;
  resourceKey?: string | null;
  displayName?: string | null;
  maxFormula?: string | null;
  maxFormulaStatus?: string | null;
  maxFormulaMessage?: string | null;
  resetRestType?: string | null;
  allowNegative: boolean;
  sharedPoolKey?: string | null;
}

export interface ResourceDefinitionEdit {
  resourceKey: string;
  displayName?: string;
  maxFormula?: string;
  resetRestType?: string;
  allowNegative: boolean;
  sharedPoolKey?: string;
}

/** A DAMAGE rule's definition for the admin editor. */
export interface DamageRuleAdmin {
  id?: string | null;
  diceFormula?: string | null;
  diceFormulaStatus?: string | null;
  diceFormulaMessage?: string | null;
  flatFormula?: string | null;
  flatFormulaStatus?: string | null;
  flatFormulaMessage?: string | null;
  damageTypeId?: string | null;
  requiresAttackHit: boolean;
  requiresSave: boolean;
  halfOnSave: boolean;
}

export interface DamageRuleEdit {
  diceFormula?: string | null;
  flatFormula?: string | null;
  damageTypeId?: string | null;
  requiresAttackHit: boolean;
  requiresSave: boolean;
  halfOnSave: boolean;
}

export interface ActionTypeOption {
  id: string;
  code: string;
  label: string;
}

/** One DSL vocabulary entry (function or scalar) for the formula autocomplete — served by the backend. */
export interface FormulaVocabEntry {
  name: string;
  kind: 'function' | 'scalar';
  insertText: string;
  signature: string;
  /** For keyed functions: which dynamic list fills the string arg. */
  argKind?: 'ability' | 'class' | 'resource_key' | 'target' | 'dice' | null;
  description?: string | null;
}

export interface FormulaVocabulary {
  functions: FormulaVocabEntry[];
  scalars: FormulaVocabEntry[];
  abilityCodes: string[];
}

export interface ActionCostAdmin {
  id?: string | null;
  actionTypeId?: string | null;
  amount?: number | null;
  conditionFormula?: string | null;
  conditionFormulaStatus?: string | null;
  conditionFormulaMessage?: string | null;
}

export interface ActionCostEdit {
  actionTypeId?: string | null;
  amount?: number | null;
  conditionFormula?: string | null;
}

export interface TargetTypeOption {
  id: string;
  code: string;
  label: string;
}

/** A HEALING rule's definition for the admin editor. */
export interface HealingRuleAdmin {
  id?: string | null;
  amountFormula?: string | null;
  amountFormulaType?: string | null;
  amountFormulaStatus?: string | null;
  amountFormulaMessage?: string | null;
  targetTypeId?: string | null;
  tempHp: boolean;
  canReviveFromZero: boolean;
}

export interface HealingRuleEdit {
  amountFormula?: string | null;
  amountFormulaType?: string | null;
  targetTypeId?: string | null;
  tempHp: boolean;
  canReviveFromZero: boolean;
}

/** Generic reference-table option; `id` is null for code-only enums (stacking policy). */
export interface RuleRefOption {
  id?: string | null;
  code: string;
  label: string;
}

export interface EffectMetadata {
  durationUnits: RuleRefOption[];
  stackingPolicies: RuleRefOption[];
  targetTypes: RuleRefOption[];
  restTypes: RuleRefOption[];
  triggerEventTypes: RuleRefOption[];
}

export interface EffectModifierAdmin {
  id?: string | null;
  modifierType?: string | null;
  valueFormula?: string | null;
  valueFormulaStatus?: string | null;
  valueFormulaMessage?: string | null;
  damageTypeId?: string | null;
}

export interface EffectEndConditionAdmin {
  id?: string | null;
  triggerEventTypeId?: string | null;
  sameFeatureReuse: boolean;
  restTypeId?: string | null;
  predicateFormula?: string | null;
  predicateFormulaStatus?: string | null;
  predicateFormulaMessage?: string | null;
}

/** The full ACTIVE_EFFECT graph for the admin editor. */
export interface ActiveEffectAdmin {
  definitionId?: string | null;
  effectKey?: string | null;
  displayName?: string | null;
  durationFormula?: string | null;
  durationFormulaStatus?: string | null;
  durationFormulaMessage?: string | null;
  durationUnitId?: string | null;
  concentrationRequired: boolean;
  stackingPolicy?: string | null;
  activeEffectGroup?: string | null;
  targetTypeId?: string | null;
  modifiers: EffectModifierAdmin[];
  endConditions: EffectEndConditionAdmin[];
}

export interface EffectModifierEdit {
  modifierType?: string | null;
  valueFormula?: string | null;
  damageTypeId?: string | null;
}

export interface EffectEndConditionEdit {
  triggerEventTypeId?: string | null;
  sameFeatureReuse: boolean;
  restTypeId?: string | null;
  predicateFormula?: string | null;
}

export interface ActiveEffectEdit {
  effectKey: string;
  displayName?: string | null;
  durationFormula?: string | null;
  durationUnitId?: string | null;
  concentrationRequired: boolean;
  stackingPolicy?: string | null;
  activeEffectGroup?: string | null;
  targetTypeId?: string | null;
  modifiers: EffectModifierEdit[];
  endConditions: EffectEndConditionEdit[];
}

export interface ResolutionMetadata {
  resolutionTypes: RuleRefOption[];
  abilities: RuleRefOption[];
  skills: RuleRefOption[];
}

/** A SAVE_CHECK_ATTACK resolution rule for the admin editor. */
export interface ResolutionRuleAdmin {
  id?: string | null;
  resolutionType?: string | null;
  abilityId?: string | null;
  skillId?: string | null;
  dcFormula?: string | null;
  dcFormulaStatus?: string | null;
  dcFormulaMessage?: string | null;
}

export interface ResolutionRuleEdit {
  resolutionType: string;
  abilityId?: string | null;
  skillId?: string | null;
  dcFormula?: string | null;
}

/** A MONSTER_FORM (Wild Shape) filter for the admin editor. */
export interface MonsterFormAdmin {
  id?: string | null;
  creatureType?: string | null;
  maxCrFormula?: string | null;
  maxCrFormulaStatus?: string | null;
  maxCrFormulaMessage?: string | null;
  movementRestriction?: string | null;
  sizeFilter?: string | null;
  sourceFilter?: string | null;
}

export interface MonsterFormEdit {
  creatureType?: string | null;
  maxCrFormula?: string | null;
  movementRestriction?: string | null;
  sizeFilter?: string | null;
  sourceFilter?: string | null;
}

/** A TRIGGER_REACTION binding for the admin editor. */
export interface TriggerAdmin {
  id?: string | null;
  eventTypeId?: string | null;
  timing?: string | null;
  predicateFormula?: string | null;
  predicateFormulaStatus?: string | null;
  predicateFormulaMessage?: string | null;
  requiresPlayerConfirmation: boolean;
  consumesReaction: boolean;
}

export interface TriggerEdit {
  eventTypeId?: string | null;
  timing?: string | null;
  predicateFormula?: string | null;
  requiresPlayerConfirmation: boolean;
  consumesReaction: boolean;
}

/** A SPELL_GRANT for the admin editor. */
export interface SpellGrantAdmin {
  id?: string | null;
  spellId?: string | null;
  countsAgainstKnown: boolean;
  alwaysPrepared: boolean;
  castWithoutSlot: boolean;
  spellcastingAbilityOverrideId?: string | null;
}

export interface SpellGrantEdit {
  spellId?: string | null;
  countsAgainstKnown: boolean;
  alwaysPrepared: boolean;
  castWithoutSlot: boolean;
  spellcastingAbilityOverrideId?: string | null;
}

/** Rule Workbench admin client. Mirrors the core /api/admin conventions (ApiResponse envelope). */
export const featureRulesApi = {
  getMetadata: async (): Promise<ApiResponse<FeatureRuleMetadata>> => {
    const response = await api.get<ApiResponse<FeatureRuleMetadata>>('/admin/feature-rules/metadata');
    return response.data;
  },

  getProblemFeatures: async (filters: ProblemFeatureFilters = {}): Promise<ApiResponse<ProblemFeatureSummary[]>> => {
    const response = await api.get<ApiResponse<ProblemFeatureSummary[]>>('/admin/feature-rules/features', {
      params: filters,
    });
    return response.data;
  },

  getFeatureDetail: async (featureId: string): Promise<ApiResponse<FeatureRuleDetail>> => {
    const response = await api.get<ApiResponse<FeatureRuleDetail>>(`/admin/class-features/${featureId}/detail`);
    return response.data;
  },

  getFeatureRules: async (featureId: string): Promise<ApiResponse<FeatureRuleResponse[]>> => {
    const response = await api.get<ApiResponse<FeatureRuleResponse[]>>(`/admin/class-features/${featureId}/rules`);
    return response.data;
  },

  createRule: async (
    featureId: string,
    data: CreateFeatureRuleRequest,
  ): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleResponse>>(
      `/admin/class-features/${featureId}/rules`,
      data,
    );
    return response.data;
  },

  updateRule: async (
    ruleId: string,
    data: UpdateFeatureRuleRequest,
  ): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.put<ApiResponse<FeatureRuleResponse>>(`/admin/feature-rules/${ruleId}`, data);
    return response.data;
  },

  approveRule: async (ruleId: string): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleResponse>>(`/admin/feature-rules/${ruleId}/approve`);
    return response.data;
  },

  disableRule: async (ruleId: string): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleResponse>>(`/admin/feature-rules/${ruleId}/disable`);
    return response.data;
  },

  validateRule: async (ruleId: string): Promise<ApiResponse<FeatureRuleValidationResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleValidationResponse>>(
      `/admin/feature-rules/${ruleId}/validate`,
    );
    return response.data;
  },

  getFeatureIssues: async (featureId: string): Promise<ApiResponse<FeatureRuleIssueResponse[]>> => {
    const response = await api.get<ApiResponse<FeatureRuleIssueResponse[]>>(
      `/admin/class-features/${featureId}/issues`,
    );
    return response.data;
  },

  getGlobalIssues: async (filters: IssueFilters = {}): Promise<ApiResponse<FeatureRuleIssueResponse[]>> => {
    const response = await api.get<ApiResponse<FeatureRuleIssueResponse[]>>('/admin/class-features/issues', {
      params: filters,
    });
    return response.data;
  },

  createIssue: async (
    featureId: string,
    data: CreateFeatureRuleIssueRequest,
  ): Promise<ApiResponse<FeatureRuleIssueResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleIssueResponse>>(
      `/admin/class-features/${featureId}/issues`,
      data,
    );
    return response.data;
  },

  resolveIssue: async (issueId: string): Promise<ApiResponse<FeatureRuleIssueResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleIssueResponse>>(
      `/admin/feature-rule-issues/${issueId}/resolve`,
    );
    return response.data;
  },

  // ── Revisions & scope (Stage 2) ──
  getRevisions: async (ruleId: string): Promise<ApiResponse<FeatureRuleRevisionResponse[]>> => {
    const response = await api.get<ApiResponse<FeatureRuleRevisionResponse[]>>(
      `/admin/feature-rules/${ruleId}/revisions`,
    );
    return response.data;
  },

  createDraft: async (ruleId: string, data: RevisionActionRequest = {}): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleResponse>>(
      `/admin/feature-rules/${ruleId}/create-draft`,
      data,
    );
    return response.data;
  },

  rollback: async (ruleId: string, data: RevisionActionRequest): Promise<ApiResponse<FeatureRuleResponse>> => {
    const response = await api.post<ApiResponse<FeatureRuleResponse>>(
      `/admin/feature-rules/${ruleId}/rollback`,
      data,
    );
    return response.data;
  },

  getRulesets: async (): Promise<ApiResponse<RulesetOption[]>> => {
    const response = await api.get<ApiResponse<RulesetOption[]>>('/admin/feature-rules/rulesets');
    return response.data;
  },

  getRuleSources: async (): Promise<ApiResponse<RuleSourceOption[]>> => {
    const response = await api.get<ApiResponse<RuleSourceOption[]>>('/admin/feature-rules/rule-sources');
    return response.data;
  },

  // ── Formulas (Stage 3) ──
  validateFormula: async (data: FeatureFormulaValidateRequest): Promise<ApiResponse<FeatureFormulaValidation>> => {
    const response = await api.post<ApiResponse<FeatureFormulaValidation>>('/admin/feature-formulas/validate', data);
    return response.data;
  },

  evaluateFormula: async (data: FeatureFormulaEvaluateRequest): Promise<ApiResponse<FeatureFormulaEvaluateResult>> => {
    const response = await api.post<ApiResponse<FeatureFormulaEvaluateResult>>(
      '/admin/feature-formulas/evaluate-preview',
      data,
    );
    return response.data;
  },

  // ── Backfill, coverage & bulk review (Stage 12) ──
  getCoverage: async (): Promise<ApiResponse<FeatureRuleCoverage>> => {
    const response = await api.get<ApiResponse<FeatureRuleCoverage>>('/admin/feature-rules/coverage');
    return response.data;
  },

  runBackfill: async (apply: boolean): Promise<ApiResponse<FeatureRuleBackfillResult>> => {
    const response = await api.post<ApiResponse<FeatureRuleBackfillResult>>(
      '/admin/feature-rules/backfill',
      null,
      { params: { apply } },
    );
    return response.data;
  },

  batchApprove: async (ruleType: string): Promise<ApiResponse<number>> => {
    const response = await api.post<ApiResponse<number>>('/admin/feature-rules/batch-approve', null, {
      params: { ruleType },
    });
    return response.data;
  },

  // ── Resource rule editor ──
  getResourceDefinition: async (ruleId: string): Promise<ApiResponse<ResourceDefinitionAdmin | null>> => {
    const response = await api.get<ApiResponse<ResourceDefinitionAdmin | null>>(
      `/admin/feature-rules/${ruleId}/resource-definition`,
    );
    return response.data;
  },

  saveResourceDefinition: async (
    ruleId: string,
    data: ResourceDefinitionEdit,
  ): Promise<ApiResponse<ResourceDefinitionAdmin>> => {
    const response = await api.put<ApiResponse<ResourceDefinitionAdmin>>(
      `/admin/feature-rules/${ruleId}/resource-definition`,
      data,
    );
    return response.data;
  },

  getDamageRule: async (ruleId: string): Promise<ApiResponse<DamageRuleAdmin | null>> =>
    (await api.get<ApiResponse<DamageRuleAdmin | null>>(`/admin/feature-rules/${ruleId}/damage-rule`)).data,

  saveDamageRule: async (ruleId: string, data: DamageRuleEdit): Promise<ApiResponse<DamageRuleAdmin>> =>
    (await api.put<ApiResponse<DamageRuleAdmin>>(`/admin/feature-rules/${ruleId}/damage-rule`, data)).data,

  getActionTypes: async (): Promise<ApiResponse<ActionTypeOption[]>> =>
    (await api.get<ApiResponse<ActionTypeOption[]>>('/admin/feature-rules/action-types')).data,

  getResourceKeys: async (): Promise<ApiResponse<string[]>> =>
    (await api.get<ApiResponse<string[]>>('/admin/feature-rules/resource-keys')).data,

  getFormulaVocabulary: async (lang?: string): Promise<ApiResponse<FormulaVocabulary>> =>
    (await api.get<ApiResponse<FormulaVocabulary>>('/admin/feature-formulas/vocabulary', { params: { lang } })).data,

  getActionCost: async (ruleId: string): Promise<ApiResponse<ActionCostAdmin | null>> =>
    (await api.get<ApiResponse<ActionCostAdmin | null>>(`/admin/feature-rules/${ruleId}/action-cost`)).data,

  saveActionCost: async (ruleId: string, data: ActionCostEdit): Promise<ApiResponse<ActionCostAdmin>> =>
    (await api.put<ApiResponse<ActionCostAdmin>>(`/admin/feature-rules/${ruleId}/action-cost`, data)).data,

  getTargetTypes: async (): Promise<ApiResponse<TargetTypeOption[]>> =>
    (await api.get<ApiResponse<TargetTypeOption[]>>('/admin/feature-rules/target-types')).data,

  getHealingRule: async (ruleId: string): Promise<ApiResponse<HealingRuleAdmin | null>> =>
    (await api.get<ApiResponse<HealingRuleAdmin | null>>(`/admin/feature-rules/${ruleId}/healing-rule`)).data,

  saveHealingRule: async (ruleId: string, data: HealingRuleEdit): Promise<ApiResponse<HealingRuleAdmin>> =>
    (await api.put<ApiResponse<HealingRuleAdmin>>(`/admin/feature-rules/${ruleId}/healing-rule`, data)).data,

  getEffectMetadata: async (): Promise<ApiResponse<EffectMetadata>> =>
    (await api.get<ApiResponse<EffectMetadata>>('/admin/feature-rules/effect-metadata')).data,

  getActiveEffect: async (ruleId: string): Promise<ApiResponse<ActiveEffectAdmin | null>> =>
    (await api.get<ApiResponse<ActiveEffectAdmin | null>>(`/admin/feature-rules/${ruleId}/active-effect`)).data,

  saveActiveEffect: async (ruleId: string, data: ActiveEffectEdit): Promise<ApiResponse<ActiveEffectAdmin>> =>
    (await api.put<ApiResponse<ActiveEffectAdmin>>(`/admin/feature-rules/${ruleId}/active-effect`, data)).data,

  getResolutionMetadata: async (): Promise<ApiResponse<ResolutionMetadata>> =>
    (await api.get<ApiResponse<ResolutionMetadata>>('/admin/feature-rules/resolution-metadata')).data,

  getResolutionRule: async (ruleId: string): Promise<ApiResponse<ResolutionRuleAdmin | null>> =>
    (await api.get<ApiResponse<ResolutionRuleAdmin | null>>(`/admin/feature-rules/${ruleId}/resolution-rule`)).data,

  saveResolutionRule: async (ruleId: string, data: ResolutionRuleEdit): Promise<ApiResponse<ResolutionRuleAdmin>> =>
    (await api.put<ApiResponse<ResolutionRuleAdmin>>(`/admin/feature-rules/${ruleId}/resolution-rule`, data)).data,

  getMonsterForm: async (ruleId: string): Promise<ApiResponse<MonsterFormAdmin | null>> =>
    (await api.get<ApiResponse<MonsterFormAdmin | null>>(`/admin/feature-rules/${ruleId}/monster-form`)).data,

  saveMonsterForm: async (ruleId: string, data: MonsterFormEdit): Promise<ApiResponse<MonsterFormAdmin>> =>
    (await api.put<ApiResponse<MonsterFormAdmin>>(`/admin/feature-rules/${ruleId}/monster-form`, data)).data,

  getTrigger: async (ruleId: string): Promise<ApiResponse<TriggerAdmin | null>> =>
    (await api.get<ApiResponse<TriggerAdmin | null>>(`/admin/feature-rules/${ruleId}/trigger`)).data,

  saveTrigger: async (ruleId: string, data: TriggerEdit): Promise<ApiResponse<TriggerAdmin>> =>
    (await api.put<ApiResponse<TriggerAdmin>>(`/admin/feature-rules/${ruleId}/trigger`, data)).data,

  getSpellGrant: async (ruleId: string): Promise<ApiResponse<SpellGrantAdmin | null>> =>
    (await api.get<ApiResponse<SpellGrantAdmin | null>>(`/admin/feature-rules/${ruleId}/spell-grant`)).data,

  saveSpellGrant: async (ruleId: string, data: SpellGrantEdit): Promise<ApiResponse<SpellGrantAdmin>> =>
    (await api.put<ApiResponse<SpellGrantAdmin>>(`/admin/feature-rules/${ruleId}/spell-grant`, data)).data,
};
