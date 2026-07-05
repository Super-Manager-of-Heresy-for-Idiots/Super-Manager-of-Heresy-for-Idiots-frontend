import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import toast from 'react-hot-toast';
import {
  featureRulesApi,
  type ActionCostEdit,
  type ActiveEffectEdit,
  type DamageRuleEdit,
  type HealingRuleEdit,
  type IssueFilters,
  type MonsterFormEdit,
  type ProblemFeatureFilters,
  type ResolutionRuleEdit,
  type ResourceDefinitionEdit,
  type SpellGrantEdit,
  type TriggerEdit,
} from '@/api/featureRules.api';
import { referenceApi } from '@/api/reference.api';
import { useT, useI18n } from '@/i18n/I18nContext';
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

// ── Backfill / coverage / bulk review (Stage 12) ──

export function useFeatureCoverage() {
  return useQuery({
    queryKey: ['fr-coverage'],
    queryFn: async () => (await featureRulesApi.getCoverage()).data,
    staleTime: 30 * 1000,
  });
}

export function useRunBackfill() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (apply: boolean) => featureRulesApi.runBackfill(apply),
    onSuccess: (_res, apply) => {
      queryClient.invalidateQueries({ queryKey: ['fr-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['fr-problem-features'] });
      toast.success(apply ? t('hk.featureRule.backfillApplied') : t('hk.featureRule.backfillDryRun'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.backfillFailed'));
    },
  });
}

// ── Resource rule editor ──

export function useResourceDefinition(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-resource-def', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getResourceDefinition(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveResourceDefinition() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: ResourceDefinitionEdit }) =>
      featureRulesApi.saveResourceDefinition(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-resource-def', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

// ── Damage rule editor ──

export function useDamageTypes() {
  return useQuery({
    queryKey: ['ref-damage-types'],
    queryFn: async () => (await referenceApi.getDamageTypes()).data ?? [],
    staleTime: 60 * 60 * 1000,
  });
}

export function useDamageRule(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-damage-rule', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getDamageRule(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveDamageRule() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: DamageRuleEdit }) =>
      featureRulesApi.saveDamageRule(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-damage-rule', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

// ── Action-cost rule editor ──

export function useActionTypes() {
  return useQuery({
    queryKey: ['fr-action-types'],
    queryFn: async () => (await featureRulesApi.getActionTypes()).data ?? [],
    staleTime: 60 * 60 * 1000,
  });
}

export function useResourceKeys() {
  return useQuery({
    queryKey: ['fr-resource-keys'],
    queryFn: async () => (await featureRulesApi.getResourceKeys()).data ?? [],
    staleTime: 5 * 60 * 1000,
  });
}

export function useFormulaVocabulary() {
  const { lang } = useI18n();
  return useQuery({
    queryKey: ['fr-formula-vocab', lang],
    queryFn: async () => (await featureRulesApi.getFormulaVocabulary(lang)).data ?? null,
    staleTime: 60 * 60 * 1000,
  });
}

export function useActionCost(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-action-cost', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getActionCost(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveActionCost() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: ActionCostEdit }) =>
      featureRulesApi.saveActionCost(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-action-cost', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

export function useTargetTypes() {
  return useQuery({
    queryKey: ['fr-target-types'],
    queryFn: async () => (await featureRulesApi.getTargetTypes()).data ?? [],
    staleTime: 60 * 60 * 1000,
  });
}

export function useHealingRule(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-healing-rule', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getHealingRule(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveHealingRule() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: HealingRuleEdit }) =>
      featureRulesApi.saveHealingRule(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-healing-rule', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

export function useEffectMetadata() {
  return useQuery({
    queryKey: ['fr-effect-metadata'],
    queryFn: async () => (await featureRulesApi.getEffectMetadata()).data ?? null,
    staleTime: 60 * 60 * 1000,
  });
}

export function useActiveEffect(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-active-effect', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getActiveEffect(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveActiveEffect() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: ActiveEffectEdit }) =>
      featureRulesApi.saveActiveEffect(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-active-effect', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

export function useResolutionMetadata() {
  return useQuery({
    queryKey: ['fr-resolution-metadata'],
    queryFn: async () => (await featureRulesApi.getResolutionMetadata()).data ?? null,
    staleTime: 60 * 60 * 1000,
  });
}

export function useResolutionRule(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-resolution-rule', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getResolutionRule(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveResolutionRule() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: ResolutionRuleEdit }) =>
      featureRulesApi.saveResolutionRule(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: ['fr-resolution-rule', ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

function useSaveHelper<TData>(
  keyPrefix: string,
  fn: (ruleId: string, data: TData) => Promise<unknown>,
) {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ruleId, data }: { ruleId: string; featureId: string; data: TData }) => fn(ruleId, data),
    onSuccess: (_res, { ruleId, featureId }) => {
      queryClient.invalidateQueries({ queryKey: [keyPrefix, ruleId] });
      queryClient.invalidateQueries({ queryKey: keys.detail(featureId) });
      queryClient.invalidateQueries({ queryKey: keys.rules(featureId) });
      toast.success(t('adm.ruleWorkbench.resource.saved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('adm.ruleWorkbench.resource.saveFailed'));
    },
  });
}

export function useMonsterForm(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-monster-form', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getMonsterForm(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveMonsterForm() {
  return useSaveHelper<MonsterFormEdit>('fr-monster-form', featureRulesApi.saveMonsterForm);
}

export function useTrigger(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-trigger', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getTrigger(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveTrigger() {
  return useSaveHelper<TriggerEdit>('fr-trigger', featureRulesApi.saveTrigger);
}

export function useSpellGrant(ruleId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: ['fr-spell-grant', ruleId ?? ''],
    queryFn: async () => (await featureRulesApi.getSpellGrant(ruleId as string)).data ?? null,
    enabled: !!ruleId && enabled,
  });
}

export function useSaveSpellGrant() {
  return useSaveHelper<SpellGrantEdit>('fr-spell-grant', featureRulesApi.saveSpellGrant);
}

export function useBatchApprove() {
  const t = useT();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ruleType: string) => featureRulesApi.batchApprove(ruleType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fr-coverage'] });
      queryClient.invalidateQueries({ queryKey: ['fr-problem-features'] });
      toast.success(t('hk.featureRule.batchApproved'));
    },
    onError: (error: AxiosError<ApiError>) => {
      toast.error(error.response?.data?.message || t('hk.featureRule.batchApproveFailed'));
    },
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
