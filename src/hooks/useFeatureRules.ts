import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  featureRulesApi,
  type IssueFilters,
  type ProblemFeatureFilters,
} from '@/api/featureRules.api';
import { useT } from '@/i18n/I18nContext';
import type {
  ApiError,
  CreateFeatureRuleIssueRequest,
  CreateFeatureRuleRequest,
  FeatureFormulaEvaluateRequest,
  FeatureFormulaValidateRequest,
  UpdateFeatureRuleRequest,
} from '@/types';

const keys = {
  metadata: ['fr-metadata'] as const,
  problemFeatures: (filters: ProblemFeatureFilters) => ['fr-problem-features', filters] as const,
  detail: (featureId: string) => ['fr-detail', featureId] as const,
  rules: (featureId: string) => ['fr-rules', featureId] as const,
  issues: (featureId: string) => ['fr-issues', featureId] as const,
  globalIssues: (filters: IssueFilters) => ['fr-issues-global', filters] as const,
  revisions: (ruleId: string) => ['fr-revisions', ruleId] as const,
};

export function useFeatureRuleMetadata() {
  return useQuery({
    queryKey: keys.metadata,
    queryFn: async () => (await featureRulesApi.getMetadata()).data,
    staleTime: 60 * 60 * 1000, // vocab rarely changes
  });
}

export function useProblemFeatures(filters: ProblemFeatureFilters = {}) {
  return useQuery({
    queryKey: keys.problemFeatures(filters),
    queryFn: async () => (await featureRulesApi.getProblemFeatures(filters)).data,
  });
}

export function useFeatureDetail(featureId: string | null) {
  return useQuery({
    queryKey: keys.detail(featureId ?? ''),
    queryFn: async () => (await featureRulesApi.getFeatureDetail(featureId as string)).data,
    enabled: !!featureId,
  });
}

export function useFeatureRules(featureId: string | null) {
  return useQuery({
    queryKey: keys.rules(featureId ?? ''),
    queryFn: async () => (await featureRulesApi.getFeatureRules(featureId as string)).data,
    enabled: !!featureId,
  });
}

export function useFeatureIssues(featureId: string | null) {
  return useQuery({
    queryKey: keys.issues(featureId ?? ''),
    queryFn: async () => (await featureRulesApi.getFeatureIssues(featureId as string)).data,
    enabled: !!featureId,
  });
}

export function useGlobalIssues(filters: IssueFilters = {}) {
  return useQuery({
    queryKey: keys.globalIssues(filters),
    queryFn: async () => (await featureRulesApi.getGlobalIssues(filters)).data,
  });
}

/** Invalidate every query that could be affected by a change to a feature's rules/issues. */
function useFeatureInvalidator() {
  const queryClient = useQueryClient();
  return (featureId: string) => {
    queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
    queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
    queryClient.invalidateQueries({ queryKey: keys.issues(featureId) });
    queryClient.invalidateQueries({ queryKey: ['fr-problem-features'] });
    queryClient.invalidateQueries({ queryKey: ['fr-issues-global'] });
    queryClient.invalidateQueries({ queryKey: ['fr-revisions'] });
  };
}

export function useRuleRevisions(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: keys.revisions(ruleId ?? ''),
    queryFn: async () => (await featureRulesApi.getRevisions(ruleId as string)).data,
    enabled: !!ruleId && enabled,
  });
}

export function useCreateDraft() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ ruleId }: { ruleId: string; featureId: string }) => featureRulesApi.createDraft(ruleId),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.draftCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.draftCreateFailed'));
    },
  });
}

export function useRollback() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ ruleId, targetRevisionId }: { ruleId: string; featureId: string; targetRevisionId: string }) =>
      featureRulesApi.rollback(ruleId, { targetRevisionId }),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.rolledBack'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.rollbackFailed'));
    },
  });
}

export function useCreateFeatureRule() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: CreateFeatureRuleRequest }) =>
      featureRulesApi.createRule(featureId, data),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.created'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.createFailed'));
    },
  });
}

export function useUpdateFeatureRule() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: UpdateFeatureRuleRequest }) =>
      featureRulesApi.updateRule(ruleId, data),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.updated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.updateFailed'));
    },
  });
}

export function useApproveRule() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ ruleId }: { ruleId: string; featureId: string }) => featureRulesApi.approveRule(ruleId),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.approved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.approveFailed'));
    },
  });
}

export function useDisableRule() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ ruleId }: { ruleId: string; featureId: string }) => featureRulesApi.disableRule(ruleId),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.disabled'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.disableFailed'));
    },
  });
}

export function useValidateRule() {
  return useMutation({
    mutationFn: (ruleId: string) => featureRulesApi.validateRule(ruleId),
  });
}

// ── Formula lab (Stage 3) ──

export function useValidateFormula() {
  return useMutation({
    mutationFn: (data: FeatureFormulaValidateRequest) => featureRulesApi.validateFormula(data),
  });
}

export function usePreviewFormula() {
  return useMutation({
    mutationFn: (data: FeatureFormulaEvaluateRequest) => featureRulesApi.evaluateFormula(data),
  });
}

export function useCreateIssue() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ featureId, data }: { featureId: string; data: CreateFeatureRuleIssueRequest }) =>
      featureRulesApi.createIssue(featureId, data),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.issueCreated'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.issueCreateFailed'));
    },
  });
}

export function useResolveIssue() {
  const t = useT();
  const invalidate = useFeatureInvalidator();
  return useMutation({
    mutationFn: ({ issueId }: { issueId: string; featureId: string }) => featureRulesApi.resolveIssue(issueId),
    onSuccess: (_res, { featureId }) => {
      invalidate(featureId);
      toast.success(t('hk.featureRule.issueResolved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.issueResolveFailed'));
    },
  });
}
