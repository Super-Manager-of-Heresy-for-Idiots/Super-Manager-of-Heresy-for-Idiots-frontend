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
};
