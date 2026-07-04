import { Fragment, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Check, GitBranch, History, Plus, RotateCcw, ShieldCheck } from 'lucide-react';
import {
  ExpandChevron,
  ExpandableRow,
  DetailStatus,
} from '@/components/common/ExpandableRow';
import {
  useApproveRule,
  useBatchApprove,
  useCreateDraft,
  useCreateFeatureRule,
  useCreateIssue,
  useDisableRule,
  useFeatureCoverage,
  useFeatureDetail,
  useFeatureRuleMetadata,
  useProblemFeatures,
  useResolveIssue,
  useRollback,
  useRuleRevisions,
  useRunBackfill,
  useValidateRule,
} from '@/hooks/useFeatureRules';
import type { ProblemFeatureFilters } from '@/api/featureRules.api';
import type {
  FeatureRuleIssueResponse,
  FeatureRuleMetadata,
  FeatureRuleResponse,
  FeatureRuleSeverity,
  ProblemFeatureSummary,
} from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import FormulaLab from './FormulaLab';
import s from './RuleWorkbenchPage.module.css';

const COL_COUNT = 6;

const STATUS_CLASS: Record<string, string> = {
  draft: s.statusDraft,
  needs_review: s.statusNeedsReview,
  approved: s.statusApproved,
  disabled: s.statusDisabled,
};

const SEVERITY_CLASS: Record<string, string> = {
  info: s.sevInfo,
  warn: s.sevWarn,
  error: s.sevError,
};

function StatusBadge({ code, label }: { code: string; label?: string }) {
  return <span className={cn(s.badge, STATUS_CLASS[code] ?? s.badgeNeutral)}>{label ?? code}</span>;
}

function SeverityBadge({ code }: { code: string }) {
  return <span className={cn(s.badge, SEVERITY_CLASS[code] ?? s.badgeNeutral)}>{code}</span>;
}

/* ── Setup: how-to README + backfill / coverage / bulk-approve ───────────── */

function WorkbenchSetup() {
  const t = useT();
  const { data: coverage } = useFeatureCoverage();
  const backfill = useRunBackfill();
  const batchApprove = useBatchApprove();
  const [readmeOpen, setReadmeOpen] = useState(false);
  const busy = backfill.isPending || batchApprove.isPending;

  return (
    <div className={cn('ao-panel', s.setup)}>
      <button className={s.readmeToggle} onClick={() => setReadmeOpen((o) => !o)}>
        <ExpandChevron open={readmeOpen} /> {t('adm.ruleWorkbench.readme.title')}
      </button>
      {readmeOpen && (
        <div className={s.readmeBody}>
          <p>{t('adm.ruleWorkbench.readme.intro')}</p>
          <ol className={s.readmeSteps}>
            <li>{t('adm.ruleWorkbench.readme.step1')}</li>
            <li>{t('adm.ruleWorkbench.readme.step2')}</li>
            <li>{t('adm.ruleWorkbench.readme.step3')}</li>
            <li>{t('adm.ruleWorkbench.readme.step4')}</li>
          </ol>
          <p className={s.muted}>{t('adm.ruleWorkbench.readme.note')}</p>
        </div>
      )}

      <div className={s.setupRow}>
        <span className={s.coverage}>
          {coverage
            ? t('adm.ruleWorkbench.setup.coverage', {
                withRules: coverage.featuresWithRules,
                total: coverage.runtimeFeatures,
                approved: coverage.featuresWithApprovedRules,
              })
            : t('adm.ruleWorkbench.setup.noCoverage')}
        </span>
        <div className={s.setupActions}>
          <button className="ao-btn" onClick={() => backfill.mutate(false)} disabled={busy}>
            {t('adm.ruleWorkbench.setup.dryRun')}
          </button>
          <button className="ao-btn ao-btn--primary" onClick={() => backfill.mutate(true)} disabled={busy}>
            {t('adm.ruleWorkbench.setup.runBackfill')}
          </button>
          <button className="ao-btn" onClick={() => batchApprove.mutate('static_grant')} disabled={busy}>
            {t('adm.ruleWorkbench.setup.batchApprove')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function RuleWorkbenchPage() {
  const t = useT();
  const { data: metadata } = useFeatureRuleMetadata();

  const [ruleType, setRuleType] = useState('');
  const [reviewStatus, setReviewStatus] = useState('');
  const [severity, setSeverity] = useState('');
  const [level, setLevel] = useState('');
  const [classFilter, setClassFilter] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filters: ProblemFeatureFilters = useMemo(() => {
    const f: ProblemFeatureFilters = {};
    if (ruleType) f.ruleType = ruleType;
    if (reviewStatus) f.reviewStatus = reviewStatus;
    if (severity) f.severity = severity;
    if (level.trim()) {
      const n = Number(level);
      if (Number.isFinite(n)) f.level = n;
    }
    return f;
  }, [ruleType, reviewStatus, severity, level]);

  const { data: features, isLoading, isError, refetch } = useProblemFeatures(filters);

  // Client-side class narrowing (avoids needing a classes endpoint in Stage 1).
  const classNames = useMemo(() => {
    const set = new Set<string>();
    (features ?? []).forEach((f) => f.className && set.add(f.className));
    return Array.from(set).sort();
  }, [features]);

  const shown = useMemo(
    () => (features ?? []).filter((f) => !classFilter || f.className === classFilter),
    [features, classFilter],
  );

  return (
    <div className={s.page}>
      <header className={s.header}>
        <p className="ao-overline">{t('adm.ruleWorkbench.overline')}</p>
        <h2 className="ao-h2">{t('adm.ruleWorkbench.title')}</h2>
        <p className={s.lede}>{t('adm.ruleWorkbench.lede')}</p>
      </header>

      <WorkbenchSetup />

      <FormulaLab />

      <div className={cn('ao-panel', s.filters)}>
        <select className="ao-input" value={classFilter} onChange={(e) => setClassFilter(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.filter.allClasses')}</option>
          {classNames.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <input
          className="ao-input"
          type="number"
          min={1}
          max={20}
          placeholder={t('adm.ruleWorkbench.filter.level')}
          value={level}
          onChange={(e) => setLevel(e.target.value)}
        />
        <select className="ao-input" value={ruleType} onChange={(e) => setRuleType(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.filter.allRuleTypes')}</option>
          {metadata?.ruleTypes.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
        <select className="ao-input" value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.filter.allStatuses')}</option>
          {metadata?.reviewStatuses.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
        <select className="ao-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.filter.allSeverities')}</option>
          {metadata?.severities.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
      </div>

      <div className={cn('ao-panel', s.tablePanel)}>
        {isLoading ? (
          <DetailStatus>{t('adm.ruleWorkbench.loading')}</DetailStatus>
        ) : isError ? (
          <DetailStatus>
            {t('adm.ruleWorkbench.loadError')}{' '}
            <button className="ao-btn" onClick={() => refetch()}>{t('adm.ruleWorkbench.retry')}</button>
          </DetailStatus>
        ) : shown.length === 0 ? (
          <DetailStatus>{t('adm.ruleWorkbench.empty')}</DetailStatus>
        ) : (
          <table className="ao-table bd-table">
            <thead>
              <tr>
                <th>{t('adm.ruleWorkbench.col.feature')}</th>
                <th>{t('adm.ruleWorkbench.col.class')}</th>
                <th>{t('adm.ruleWorkbench.col.level')}</th>
                <th>{t('adm.ruleWorkbench.col.rules')}</th>
                <th>{t('adm.ruleWorkbench.col.issues')}</th>
                <th>{t('adm.ruleWorkbench.col.flag')}</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((feature) => {
                const open = expandedId === feature.featureId;
                return (
                  <Fragment key={feature.featureId}>
                    <tr
                      className={s.rowClickable}
                      onClick={() => setExpandedId(open ? null : feature.featureId)}
                    >
                      <td>
                        <span className="ao-row ao-gap-8">
                          <ExpandChevron open={open} />
                          {feature.title}
                        </span>
                      </td>
                      <td>{feature.className ?? '—'}</td>
                      <td>{feature.level ?? '—'}</td>
                      <td>{feature.approvedRuleCount}/{feature.ruleCount}</td>
                      <td>
                        {feature.openIssueCount > 0
                          ? `${feature.openIssueCount}/${feature.issueCount}`
                          : feature.issueCount}
                      </td>
                      <td>
                        {feature.hasUnresolvedError ? (
                          <span className={cn(s.badge, s.sevError)}>error</span>
                        ) : feature.maxOpenSeverity ? (
                          <SeverityBadge code={feature.maxOpenSeverity} />
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                    <ExpandableRow open={open} colSpan={COL_COUNT}>
                      {open && <FeatureCard feature={feature} metadata={metadata} />}
                    </ExpandableRow>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

/* ── Expanded feature card ──────────────────────────────────────────────── */

function FeatureCard({
  feature,
  metadata,
}: {
  feature: ProblemFeatureSummary;
  metadata?: FeatureRuleMetadata;
}) {
  const t = useT();
  const featureId = feature.featureId;
  const { data: detail, isLoading, isError } = useFeatureDetail(featureId);

  if (isLoading) return <DetailStatus>{t('adm.ruleWorkbench.loading')}</DetailStatus>;
  if (isError || !detail) return <DetailStatus>{t('adm.ruleWorkbench.loadError')}</DetailStatus>;

  return (
    <div className={s.card}>
      {detail.description && (
        <section className={s.cardSection}>
          <p className="ao-overline">{t('adm.ruleWorkbench.card.description')}</p>
          <p className={s.description}>{detail.description}</p>
        </section>
      )}

      <RulesSection featureId={featureId} rules={detail.rules} metadata={metadata} />

      {detail.grants.length > 0 && (
        <section className={s.cardSection}>
          <p className="ao-overline">{t('adm.ruleWorkbench.card.grants')}</p>
          <ul className={s.list}>
            {detail.grants.map((g) => (
              <li key={g.id} className={s.listItem}>
                <div className={s.listMain}>
                  <span className={cn(s.badge, s.badgeNeutral)}>{g.kind}</span>
                  {g.proficiencyType && <span className={s.ruleTitle}>{g.proficiencyType}</span>}
                  {g.expertise && <span className={cn(s.badge, s.statusApproved)}>expertise</span>}
                  {g.grantTiming && <span className={s.muted}>{g.grantTiming}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {detail.choices.length > 0 && (
        <section className={s.cardSection}>
          <p className="ao-overline">{t('adm.ruleWorkbench.card.choicesTitle')}</p>
          <ul className={s.list}>
            {detail.choices.map((c) => (
              <li key={c.id} className={s.listItem}>
                <div className={s.listMain}>
                  <span className={s.ruleTitle}>{c.choiceKey}</span>
                  <span className={s.muted}>
                    {t('adm.ruleWorkbench.card.choose')}: {c.minChoices ?? 1}
                    {c.choiceTiming ? ` · ${c.choiceTiming}` : ''}
                    {` · ${c.options.length} ${t('adm.ruleWorkbench.card.options')}`}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <IssuesSection featureId={featureId} issues={detail.issues} metadata={metadata} />
    </div>
  );
}

function RulesSection({
  featureId,
  rules,
  metadata,
}: {
  featureId: string;
  rules: FeatureRuleResponse[];
  metadata?: FeatureRuleMetadata;
}) {
  const t = useT();
  const approve = useApproveRule();
  const disable = useDisableRule();
  const validate = useValidateRule();
  const createRule = useCreateFeatureRule();
  const createDraft = useCreateDraft();

  const [newRuleType, setNewRuleType] = useState('');
  const [historyRuleId, setHistoryRuleId] = useState<string | null>(null);

  const onValidate = (ruleId: string) => {
    validate.mutate(ruleId, {
      onSuccess: (res) => {
        const v = res.data;
        if (v?.valid) toast.success(t('adm.ruleWorkbench.card.validOk'));
        else toast.error((v?.problems ?? []).join('; ') || t('adm.ruleWorkbench.card.validFail'));
      },
    });
  };

  const onAdd = () => {
    if (!newRuleType) return;
    createRule.mutate(
      { featureId, data: { ruleType: newRuleType } },
      { onSuccess: () => setNewRuleType('') },
    );
  };

  return (
    <section className={s.cardSection}>
      <p className="ao-overline">{t('adm.ruleWorkbench.card.rules')}</p>
      {rules.length === 0 ? (
        <p className={s.muted}>{t('adm.ruleWorkbench.card.noRules')}</p>
      ) : (
        <ul className={s.list}>
          {rules.map((rule) => {
            const historyOpen = historyRuleId === rule.id;
            return (
              <li key={rule.id} className={s.listItem}>
                <div className={s.listMain}>
                  <span className={s.ruleTitle}>{rule.ruleTypeLabel}</span>
                  <StatusBadge code={rule.reviewStatus} />
                  {!rule.enabled && <span className={cn(s.badge, s.badgeNeutral)}>{t('adm.ruleWorkbench.card.off')}</span>}
                  {rule.hasUnresolvedError && <span className={cn(s.badge, s.sevError)}>error</span>}
                  {rule.currentRevisionNumber != null && (
                    <span className={s.revChip} title={t('adm.ruleWorkbench.card.revisionTip')}>
                      <GitBranch size={12} /> r{rule.currentRevisionNumber}
                      {rule.approvedRevisionNumber != null && (
                        <span className={s.revApproved}>· ✓r{rule.approvedRevisionNumber}</span>
                      )}
                    </span>
                  )}
                  {rule.notes && <span className={s.muted}>{rule.notes}</span>}
                </div>
                <div className={s.actions}>
                  <button className="ao-btn" onClick={() => onValidate(rule.id)} disabled={validate.isPending}>
                    <ShieldCheck size={14} /> {t('adm.ruleWorkbench.card.validate')}
                  </button>
                  {rule.reviewStatus !== 'approved' && (
                    <button
                      className="ao-btn"
                      onClick={() => approve.mutate({ ruleId: rule.id, featureId })}
                      disabled={approve.isPending}
                    >
                      <Check size={14} /> {t('adm.ruleWorkbench.card.approve')}
                    </button>
                  )}
                  {rule.reviewStatus === 'approved' && (
                    <button
                      className="ao-btn"
                      onClick={() => createDraft.mutate({ ruleId: rule.id, featureId })}
                      disabled={createDraft.isPending}
                    >
                      <GitBranch size={14} /> {t('adm.ruleWorkbench.card.createDraft')}
                    </button>
                  )}
                  {rule.reviewStatus !== 'disabled' && (
                    <button
                      className="ao-btn"
                      onClick={() => disable.mutate({ ruleId: rule.id, featureId })}
                      disabled={disable.isPending}
                    >
                      <Ban size={14} /> {t('adm.ruleWorkbench.card.disable')}
                    </button>
                  )}
                  <button
                    className="ao-btn"
                    onClick={() => setHistoryRuleId(historyOpen ? null : rule.id)}
                  >
                    <History size={14} /> {t('adm.ruleWorkbench.card.history')}
                  </button>
                </div>
                {historyOpen && (
                  <div className={s.historyBlock}>
                    <RuleRevisions ruleId={rule.id} featureId={featureId} />
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <div className={s.addRow}>
        <select className="ao-input" value={newRuleType} onChange={(e) => setNewRuleType(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.card.pickRuleType')}</option>
          {metadata?.ruleTypes.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
        <button className="ao-btn" onClick={onAdd} disabled={!newRuleType || createRule.isPending}>
          <Plus size={14} /> {t('adm.ruleWorkbench.card.addRule')}
        </button>
      </div>
    </section>
  );
}

function RuleRevisions({ ruleId, featureId }: { ruleId: string; featureId: string }) {
  const t = useT();
  const { data: revisions, isLoading } = useRuleRevisions(ruleId, true);
  const rollback = useRollback();

  if (isLoading) return <DetailStatus>{t('adm.ruleWorkbench.loading')}</DetailStatus>;
  if (!revisions || revisions.length === 0) return <p className={s.muted}>{t('adm.ruleWorkbench.card.noRevisions')}</p>;

  return (
    <ul className={s.revList}>
      {revisions.map((rev) => (
        <li key={rev.id} className={s.revItem}>
          <span className={s.revNum}>r{rev.revisionNumber}</span>
          <StatusBadge code={rev.status} />
          {rev.current && <span className={cn(s.badge, s.badgeNeutral)}>{t('adm.ruleWorkbench.card.currentRev')}</span>}
          {rev.approvedActive && <span className={cn(s.badge, s.statusApproved)}>{t('adm.ruleWorkbench.card.activeRev')}</span>}
          {rev.changeReason && <span className={s.muted}>{rev.changeReason}</span>}
          {!rev.approvedActive && (
            <button
              className="ao-btn"
              onClick={() => rollback.mutate({ ruleId, featureId, targetRevisionId: rev.id })}
              disabled={rollback.isPending}
            >
              <RotateCcw size={13} /> {t('adm.ruleWorkbench.card.rollback')}
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

function IssuesSection({
  featureId,
  issues,
  metadata,
}: {
  featureId: string;
  issues: FeatureRuleIssueResponse[];
  metadata?: FeatureRuleMetadata;
}) {
  const t = useT();
  const resolve = useResolveIssue();
  const createIssue = useCreateIssue();

  const [issueType, setIssueType] = useState('');
  const [severity, setSeverity] = useState<FeatureRuleSeverity | ''>('');
  const [message, setMessage] = useState('');

  const onAdd = () => {
    if (!issueType || !severity || !message.trim()) return;
    createIssue.mutate(
      { featureId, data: { issueType, severity, message: message.trim() } },
      {
        onSuccess: () => {
          setIssueType('');
          setSeverity('');
          setMessage('');
        },
      },
    );
  };

  return (
    <section className={s.cardSection}>
      <p className="ao-overline">{t('adm.ruleWorkbench.card.issues')}</p>
      {issues.length === 0 ? (
        <p className={s.muted}>{t('adm.ruleWorkbench.card.noIssues')}</p>
      ) : (
        <ul className={s.list}>
          {issues.map((issue) => (
            <li key={issue.id} className={cn(s.listItem, issue.resolved && s.resolved)}>
              <div className={s.listMain}>
                <SeverityBadge code={issue.severity} />
                <span className={s.issueType}>{issue.issueType}</span>
                <span>{issue.message}</span>
                {issue.resolved && <Check size={14} className={s.resolvedIcon} />}
              </div>
              {!issue.resolved && (
                <div className={s.actions}>
                  <button
                    className="ao-btn"
                    onClick={() => resolve.mutate({ issueId: issue.id, featureId })}
                    disabled={resolve.isPending}
                  >
                    <Check size={14} /> {t('adm.ruleWorkbench.card.resolve')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <div className={s.addRow}>
        <select className="ao-input" value={issueType} onChange={(e) => setIssueType(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.card.pickIssueType')}</option>
          {metadata?.issueTypes.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
        <select
          className="ao-input"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as FeatureRuleSeverity | '')}
        >
          <option value="">{t('adm.ruleWorkbench.card.pickSeverity')}</option>
          {metadata?.severities.map((o) => (
            <option key={o.code} value={o.code}>{o.label}</option>
          ))}
        </select>
        <input
          className="ao-input"
          placeholder={t('adm.ruleWorkbench.card.issueMessage')}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
        />
        <button
          className="ao-btn"
          onClick={onAdd}
          disabled={!issueType || !severity || !message.trim() || createIssue.isPending}
        >
          <AlertTriangle size={14} /> {t('adm.ruleWorkbench.card.raiseIssue')}
        </button>
      </div>
    </section>
  );
}
