import { Fragment, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Ban, Check, GitBranch, History, Plus, RotateCcw, ShieldCheck, Sliders } from 'lucide-react';
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
  useActionCost,
  useActionTypes,
  useActiveEffect,
  useDamageRule,
  useDamageTypes,
  useEffectMetadata,
  useHealingRule,
  useMonsterForm,
  useProblemFeatures,
  useResolutionMetadata,
  useResolutionRule,
  useSpellGrant,
  useTrigger,
  useResolveIssue,
  useResourceDefinition,
  useRollback,
  useRuleRevisions,
  useRunBackfill,
  useSaveActionCost,
  useSaveActiveEffect,
  useSaveDamageRule,
  useSaveHealingRule,
  useSaveMonsterForm,
  useSaveResolutionRule,
  useSaveResourceDefinition,
  useSaveSpellGrant,
  useSaveTrigger,
  useTargetTypes,
  useValidateFormula,
  useValidateRule,
} from '@/hooks/useFeatureRules';
import { useSpells } from '@/hooks/useContentCatalog';
import type {
  EffectEndConditionEdit,
  EffectModifierEdit,
  ProblemFeatureFilters,
} from '@/api/featureRules.api';
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

/** Localize a backend code (severity / status / issueType) via i18n, falling back to a label or the code. */
function localizedCode(t: (k: string) => string, kind: string, code: string, fallback?: string): string {
  const key = `adm.fr.${kind}.${code}`;
  const label = t(key);
  return label === key ? (fallback ?? code) : label;
}

function StatusBadge({ code, label }: { code: string; label?: string }) {
  const t = useT();
  return <span className={cn(s.badge, STATUS_CLASS[code] ?? s.badgeNeutral)}>{localizedCode(t, 'status', code, label)}</span>;
}

function SeverityBadge({ code }: { code: string }) {
  const t = useT();
  return <span className={cn(s.badge, SEVERITY_CLASS[code] ?? s.badgeNeutral)}>{localizedCode(t, 'severity', code)}</span>;
}

/* ── Rule mechanics editor (dispatched per rule type; extensible) ────────── */

function RuleMechanicsEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  if (rule.ruleType === 'resource') {
    return <ResourceRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'damage') {
    return <DamageRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'action_cost') {
    return <ActionCostRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'healing') {
    return <HealingRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'active_effect' || rule.ruleType === 'end_condition') {
    return <ActiveEffectRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'save_check_attack') {
    return <ResolutionRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'monster_form') {
    return <MonsterFormRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'trigger_reaction') {
    return <TriggerRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'spell_grant') {
    return <SpellGrantRuleEditor rule={rule} featureId={featureId} />;
  }
  if (rule.ruleType === 'companion') {
    return <p className={s.muted}>{t('adm.ruleWorkbench.companion.note')}</p>;
  }
  return <p className={s.muted}>{t('adm.ruleWorkbench.resource.notYet')}</p>;
}

function MonsterFormRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useMonsterForm(rule.id, true);
  const save = useSaveMonsterForm();
  const validate = useValidateFormula();

  const [creatureType, setCreatureType] = useState('');
  const [maxCr, setMaxCr] = useState('');
  const [movement, setMovement] = useState('');
  const [sizeFilter, setSizeFilter] = useState('');
  const [sourceFilter, setSourceFilter] = useState('');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setCreatureType(def.creatureType ?? '');
      setMaxCr(def.maxCrFormula ?? '');
      setMovement(def.movementRestriction ?? '');
      setSizeFilter(def.sizeFilter ?? '');
      setSourceFilter(def.sourceFilter ?? '');
    }
  }, [def]);

  const onValidate = () => {
    if (!maxCr.trim()) return;
    validate.mutate(
      { expression: maxCr.trim(), resultType: 'integer' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        creatureType: creatureType.trim() || null,
        maxCrFormula: maxCr.trim() || null,
        movementRestriction: movement.trim() || null,
        sizeFilter: sizeFilter.trim() || null,
        sourceFilter: sourceFilter.trim() || null,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.form.creatureType')}</label>
        <input className="ao-input" placeholder="beast" value={creatureType} onChange={(e) => setCreatureType(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.form.maxCr')}</label>
        <input
          className="ao-input"
          placeholder='max(0.25, floor(class_level("druid")/3))'
          value={maxCr}
          onChange={(e) => { setMaxCr(e.target.value); setValidationMsg(null); }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !maxCr.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.form.movement')}</label>
        <input className="ao-input" placeholder="no_fly / no_swim" value={movement} onChange={(e) => setMovement(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.form.size')}</label>
        <input className="ao-input" placeholder="medium" value={sizeFilter} onChange={(e) => setSizeFilter(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.form.source')}</label>
        <input className="ao-input" value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} />
      </div>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function TriggerRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useTrigger(rule.id, true);
  const { data: meta } = useEffectMetadata();
  const save = useSaveTrigger();
  const validate = useValidateFormula();

  const [eventTypeId, setEventTypeId] = useState('');
  const [timing, setTiming] = useState('');
  const [predicate, setPredicate] = useState('');
  const [requiresConfirm, setRequiresConfirm] = useState(true);
  const [consumesReaction, setConsumesReaction] = useState(true);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setEventTypeId(def.eventTypeId ?? '');
      setTiming(def.timing ?? '');
      setPredicate(def.predicateFormula ?? '');
      setRequiresConfirm(def.requiresPlayerConfirmation);
      setConsumesReaction(def.consumesReaction);
    }
  }, [def]);

  const onValidate = () => {
    if (!predicate.trim()) return;
    validate.mutate(
      { expression: predicate.trim(), resultType: 'boolean' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        eventTypeId: eventTypeId || null,
        timing: timing || null,
        predicateFormula: predicate.trim() || null,
        requiresPlayerConfirmation: requiresConfirm,
        consumesReaction,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.trigger.event')}</label>
        <select className="ao-input" value={eventTypeId} onChange={(e) => setEventTypeId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.trigger.none')}</option>
          {(meta?.triggerEventTypes ?? []).map((te) => (
            <option key={te.id ?? te.code} value={te.id ?? ''}>{te.label}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.trigger.timing')}</label>
        <select className="ao-input" value={timing} onChange={(e) => setTiming(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.trigger.none')}</option>
          {['before', 'after', 'replace', 'interrupt'].map((tm) => (
            <option key={tm} value={tm}>{t(`adm.ruleWorkbench.trigger.timing.${tm}`)}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.trigger.predicate')}</label>
        <input
          className="ao-input"
          placeholder='combat_round >= 1'
          value={predicate}
          onChange={(e) => { setPredicate(e.target.value); setValidationMsg(null); }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !predicate.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <label className={s.editorCheck}>
        <input type="checkbox" checked={requiresConfirm} onChange={(e) => setRequiresConfirm(e.target.checked)} />
        {t('adm.ruleWorkbench.trigger.confirm')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={consumesReaction} onChange={(e) => setConsumesReaction(e.target.checked)} />
        {t('adm.ruleWorkbench.trigger.reaction')}
      </label>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function SpellGrantRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useSpellGrant(rule.id, true);
  const { data: spells } = useSpells();
  const { data: resMeta } = useResolutionMetadata();
  const save = useSaveSpellGrant();

  const [spellId, setSpellId] = useState('');
  const [countsKnown, setCountsKnown] = useState(false);
  const [alwaysPrepared, setAlwaysPrepared] = useState(false);
  const [castWithoutSlot, setCastWithoutSlot] = useState(false);
  const [abilityOverrideId, setAbilityOverrideId] = useState('');

  useEffect(() => {
    if (def) {
      setSpellId(def.spellId ?? '');
      setCountsKnown(def.countsAgainstKnown);
      setAlwaysPrepared(def.alwaysPrepared);
      setCastWithoutSlot(def.castWithoutSlot);
      setAbilityOverrideId(def.spellcastingAbilityOverrideId ?? '');
    }
  }, [def]);

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        spellId: spellId || null,
        countsAgainstKnown: countsKnown,
        alwaysPrepared,
        castWithoutSlot,
        spellcastingAbilityOverrideId: abilityOverrideId || null,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.spellGrant.spell')}</label>
        <select className="ao-input" value={spellId} onChange={(e) => setSpellId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.spellGrant.none')}</option>
          {(spells ?? []).map((sp) => (
            <option key={sp.id} value={sp.id}>{sp.name}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.spellGrant.abilityOverride')}</label>
        <select className="ao-input" value={abilityOverrideId} onChange={(e) => setAbilityOverrideId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.spellGrant.none')}</option>
          {(resMeta?.abilities ?? []).map((a) => (
            <option key={a.id ?? a.code} value={a.id ?? ''}>{a.label}</option>
          ))}
        </select>
      </div>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={alwaysPrepared} onChange={(e) => setAlwaysPrepared(e.target.checked)} />
        {t('adm.ruleWorkbench.spellGrant.alwaysPrepared')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={countsKnown} onChange={(e) => setCountsKnown(e.target.checked)} />
        {t('adm.ruleWorkbench.spellGrant.countsKnown')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={castWithoutSlot} onChange={(e) => setCastWithoutSlot(e.target.checked)} />
        {t('adm.ruleWorkbench.spellGrant.castWithoutSlot')}
      </label>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function ResolutionRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useResolutionRule(rule.id, true);
  const { data: meta } = useResolutionMetadata();
  const save = useSaveResolutionRule();
  const validate = useValidateFormula();

  const [resolutionType, setResolutionType] = useState('saving_throw');
  const [abilityId, setAbilityId] = useState('');
  const [skillId, setSkillId] = useState('');
  const [dc, setDc] = useState('');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setResolutionType(def.resolutionType ?? 'saving_throw');
      setAbilityId(def.abilityId ?? '');
      setSkillId(def.skillId ?? '');
      setDc(def.dcFormula ?? '');
    }
  }, [def]);

  const onValidate = () => {
    if (!dc.trim()) return;
    validate.mutate(
      { expression: dc.trim(), resultType: 'integer' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        resolutionType,
        abilityId: abilityId || null,
        skillId: skillId || null,
        dcFormula: dc.trim() || null,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resolution.type')}</label>
        <select className="ao-input" value={resolutionType} onChange={(e) => setResolutionType(e.target.value)}>
          {(meta?.resolutionTypes ?? []).map((rt) => (
            <option key={rt.code} value={rt.code}>{t(`adm.ruleWorkbench.resolution.kind.${rt.code}`)}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resolution.ability')}</label>
        <select className="ao-input" value={abilityId} onChange={(e) => setAbilityId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.resolution.none')}</option>
          {(meta?.abilities ?? []).map((a) => (
            <option key={a.id ?? a.code} value={a.id ?? ''}>{a.label}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resolution.skill')}</label>
        <select className="ao-input" value={skillId} onChange={(e) => setSkillId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.resolution.none')}</option>
          {(meta?.skills ?? []).map((sk) => (
            <option key={sk.id ?? sk.code} value={sk.id ?? ''}>{sk.label}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resolution.dc')}</label>
        <input
          className="ao-input"
          placeholder='8+proficiency_bonus+ability_mod("WIS")'
          value={dc}
          onChange={(e) => { setDc(e.target.value); setValidationMsg(null); }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !dc.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function ActiveEffectRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useActiveEffect(rule.id, true);
  const { data: meta } = useEffectMetadata();
  const { data: damageTypes } = useDamageTypes();
  const save = useSaveActiveEffect();
  const validate = useValidateFormula();

  const [effectKey, setEffectKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [duration, setDuration] = useState('');
  const [durationUnitId, setDurationUnitId] = useState('');
  const [concentration, setConcentration] = useState(false);
  const [stackingPolicy, setStackingPolicy] = useState('stack');
  const [effectGroup, setEffectGroup] = useState('');
  const [targetTypeId, setTargetTypeId] = useState('');
  const [modifiers, setModifiers] = useState<EffectModifierEdit[]>([]);
  const [endConditions, setEndConditions] = useState<EffectEndConditionEdit[]>([]);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setEffectKey(def.effectKey ?? '');
      setDisplayName(def.displayName ?? '');
      setDuration(def.durationFormula ?? '');
      setDurationUnitId(def.durationUnitId ?? '');
      setConcentration(def.concentrationRequired);
      setStackingPolicy(def.stackingPolicy ?? 'stack');
      setEffectGroup(def.activeEffectGroup ?? '');
      setTargetTypeId(def.targetTypeId ?? '');
      setModifiers((def.modifiers ?? []).map((m) => ({
        modifierType: m.modifierType ?? '',
        valueFormula: m.valueFormula ?? '',
        damageTypeId: m.damageTypeId ?? '',
      })));
      setEndConditions((def.endConditions ?? []).map((e) => ({
        triggerEventTypeId: e.triggerEventTypeId ?? '',
        sameFeatureReuse: e.sameFeatureReuse,
        restTypeId: e.restTypeId ?? '',
        predicateFormula: e.predicateFormula ?? '',
      })));
    }
  }, [def]);

  const onValidate = () => {
    if (!duration.trim()) return;
    validate.mutate(
      { expression: duration.trim(), resultType: 'integer' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () => {
    if (!effectKey.trim()) {
      toast.error(t('adm.ruleWorkbench.effect.keyRequired'));
      return;
    }
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        effectKey: effectKey.trim(),
        displayName: displayName.trim() || null,
        durationFormula: duration.trim() || null,
        durationUnitId: durationUnitId || null,
        concentrationRequired: concentration,
        stackingPolicy,
        activeEffectGroup: effectGroup.trim() || null,
        targetTypeId: targetTypeId || null,
        modifiers: modifiers
          .filter((m) => (m.modifierType ?? '').trim())
          .map((m) => ({
            modifierType: (m.modifierType ?? '').trim(),
            valueFormula: (m.valueFormula ?? '').trim() || null,
            damageTypeId: m.damageTypeId || null,
          })),
        endConditions: endConditions.map((e) => ({
          triggerEventTypeId: e.triggerEventTypeId || null,
          sameFeatureReuse: e.sameFeatureReuse,
          restTypeId: e.restTypeId || null,
          predicateFormula: (e.predicateFormula ?? '').trim() || null,
        })),
      },
    });
  };

  const patchModifier = (i: number, patch: Partial<EffectModifierEdit>) =>
    setModifiers((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const patchEnd = (i: number, patch: Partial<EffectEndConditionEdit>) =>
    setEndConditions((rows) => rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.key')}</label>
        <input className="ao-input" placeholder="rage_bonus" value={effectKey} onChange={(e) => setEffectKey(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.name')}</label>
        <input className="ao-input" value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.duration')}</label>
        <input
          className="ao-input"
          placeholder="10"
          value={duration}
          onChange={(e) => { setDuration(e.target.value); setValidationMsg(null); }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !duration.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.durationUnit')}</label>
        <select className="ao-input" value={durationUnitId} onChange={(e) => setDurationUnitId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.effect.none')}</option>
          {(meta?.durationUnits ?? []).map((u) => (
            <option key={u.id ?? u.code} value={u.id ?? ''}>{u.label}</option>
          ))}
        </select>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.stacking')}</label>
        <select className="ao-input" value={stackingPolicy} onChange={(e) => setStackingPolicy(e.target.value)}>
          {(meta?.stackingPolicies ?? []).map((p) => (
            <option key={p.code} value={p.code}>{t(`adm.ruleWorkbench.effect.stack.${p.code}`)}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.group')}</label>
        <input className="ao-input" placeholder="ac_bonus" value={effectGroup} onChange={(e) => setEffectGroup(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.effect.target')}</label>
        <select className="ao-input" value={targetTypeId} onChange={(e) => setTargetTypeId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.effect.none')}</option>
          {(meta?.targetTypes ?? []).map((tt) => (
            <option key={tt.id ?? tt.code} value={tt.id ?? ''}>{tt.label}</option>
          ))}
        </select>
      </div>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={concentration} onChange={(e) => setConcentration(e.target.checked)} />
        {t('adm.ruleWorkbench.effect.concentration')}
      </label>

      <div className={s.subGroup}>
        <div className={s.subGroupHead}>
          <span>{t('adm.ruleWorkbench.effect.modifiers')}</span>
          <button className="ao-btn" onClick={() => setModifiers((r) => [...r, { modifierType: '', valueFormula: '', damageTypeId: '' }])}>
            {t('adm.ruleWorkbench.effect.addRow')}
          </button>
        </div>
        {modifiers.length === 0 && <p className={s.muted}>{t('adm.ruleWorkbench.effect.noModifiers')}</p>}
        {modifiers.map((m, i) => (
          <div className={s.subItem} key={i}>
            <input
              className="ao-input"
              placeholder={t('adm.ruleWorkbench.effect.modifierType')}
              value={m.modifierType ?? ''}
              onChange={(e) => patchModifier(i, { modifierType: e.target.value })}
            />
            <input
              className="ao-input"
              placeholder={t('adm.ruleWorkbench.effect.value')}
              value={m.valueFormula ?? ''}
              onChange={(e) => patchModifier(i, { valueFormula: e.target.value })}
            />
            <select className="ao-input" value={m.damageTypeId ?? ''} onChange={(e) => patchModifier(i, { damageTypeId: e.target.value })}>
              <option value="">{t('adm.ruleWorkbench.effect.noDamageType')}</option>
              {(damageTypes ?? []).map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
            <button className="ao-btn" onClick={() => setModifiers((r) => r.filter((_, idx) => idx !== i))}>
              {t('adm.ruleWorkbench.effect.remove')}
            </button>
          </div>
        ))}
      </div>

      <div className={s.subGroup}>
        <div className={s.subGroupHead}>
          <span>{t('adm.ruleWorkbench.effect.endConditions')}</span>
          <button
            className="ao-btn"
            onClick={() => setEndConditions((r) => [...r, { triggerEventTypeId: '', sameFeatureReuse: false, restTypeId: '', predicateFormula: '' }])}
          >
            {t('adm.ruleWorkbench.effect.addRow')}
          </button>
        </div>
        {endConditions.length === 0 && <p className={s.muted}>{t('adm.ruleWorkbench.effect.noEndConditions')}</p>}
        {endConditions.map((e, i) => (
          <div className={s.subItem} key={i}>
            <select className="ao-input" value={e.triggerEventTypeId ?? ''} onChange={(ev) => patchEnd(i, { triggerEventTypeId: ev.target.value })}>
              <option value="">{t('adm.ruleWorkbench.effect.endTrigger')}</option>
              {(meta?.triggerEventTypes ?? []).map((te) => (
                <option key={te.id ?? te.code} value={te.id ?? ''}>{te.label}</option>
              ))}
            </select>
            <select className="ao-input" value={e.restTypeId ?? ''} onChange={(ev) => patchEnd(i, { restTypeId: ev.target.value })}>
              <option value="">{t('adm.ruleWorkbench.effect.endRest')}</option>
              {(meta?.restTypes ?? []).map((rt) => (
                <option key={rt.id ?? rt.code} value={rt.id ?? ''}>{rt.label}</option>
              ))}
            </select>
            <label className={s.editorCheck}>
              <input type="checkbox" checked={e.sameFeatureReuse} onChange={(ev) => patchEnd(i, { sameFeatureReuse: ev.target.checked })} />
              {t('adm.ruleWorkbench.effect.reuse')}
            </label>
            <button className="ao-btn" onClick={() => setEndConditions((r) => r.filter((_, idx) => idx !== i))}>
              {t('adm.ruleWorkbench.effect.remove')}
            </button>
          </div>
        ))}
      </div>

      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function HealingRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useHealingRule(rule.id, true);
  const { data: targetTypes } = useTargetTypes();
  const save = useSaveHealingRule();
  const validate = useValidateFormula();

  const [amount, setAmount] = useState('');
  const [amountType, setAmountType] = useState<'integer' | 'dice'>('integer');
  const [targetTypeId, setTargetTypeId] = useState('');
  const [tempHp, setTempHp] = useState(false);
  const [canRevive, setCanRevive] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setAmount(def.amountFormula ?? '');
      setAmountType(def.amountFormulaType === 'dice' ? 'dice' : 'integer');
      setTargetTypeId(def.targetTypeId ?? '');
      setTempHp(def.tempHp);
      setCanRevive(def.canReviveFromZero);
    }
  }, [def]);

  const onValidate = () => {
    if (!amount.trim()) return;
    validate.mutate(
      { expression: amount.trim(), resultType: amountType },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        amountFormula: amount.trim() || null,
        amountFormulaType: amountType,
        targetTypeId: targetTypeId || null,
        tempHp,
        canReviveFromZero: canRevive,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.healing.amount')}</label>
        <input
          className="ao-input"
          placeholder={amountType === 'dice' ? '1d8+ability_mod("WIS")' : '5*class_level("paladin")'}
          value={amount}
          onChange={(e) => { setAmount(e.target.value); setValidationMsg(null); }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !amount.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.healing.amountType')}</label>
        <select
          className="ao-input"
          value={amountType}
          onChange={(e) => { setAmountType(e.target.value as 'integer' | 'dice'); setValidationMsg(null); }}
        >
          <option value="integer">{t('adm.ruleWorkbench.healing.typeFlat')}</option>
          <option value="dice">{t('adm.ruleWorkbench.healing.typeDice')}</option>
        </select>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.healing.target')}</label>
        <select className="ao-input" value={targetTypeId} onChange={(e) => setTargetTypeId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.healing.targetNone')}</option>
          {(targetTypes ?? []).map((tt) => (
            <option key={tt.id} value={tt.id}>{tt.label}</option>
          ))}
        </select>
      </div>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={tempHp} onChange={(e) => setTempHp(e.target.checked)} />
        {t('adm.ruleWorkbench.healing.tempHp')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={canRevive} onChange={(e) => setCanRevive(e.target.checked)} />
        {t('adm.ruleWorkbench.healing.canRevive')}
      </label>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function ActionCostRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useActionCost(rule.id, true);
  const { data: actionTypes } = useActionTypes();
  const save = useSaveActionCost();
  const validate = useValidateFormula();

  const [actionTypeId, setActionTypeId] = useState('');
  const [amount, setAmount] = useState('1');
  const [condition, setCondition] = useState('');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setActionTypeId(def.actionTypeId ?? '');
      setAmount(def.amount != null ? String(def.amount) : '1');
      setCondition(def.conditionFormula ?? '');
    }
  }, [def]);

  const onValidate = () => {
    if (!condition.trim()) return;
    validate.mutate(
      { expression: condition.trim(), resultType: 'boolean' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () => {
    if (!actionTypeId) {
      toast.error(t('adm.ruleWorkbench.actionCost.typeRequired'));
      return;
    }
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        actionTypeId,
        amount: amount === '' ? 1 : Number(amount),
        conditionFormula: condition.trim() || null,
      },
    });
  };

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.actionCost.type')}</label>
        <select className="ao-input" value={actionTypeId} onChange={(e) => setActionTypeId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.actionCost.typeNone')}</option>
          {(actionTypes ?? []).map((a) => (
            <option key={a.id} value={a.id}>{a.label}</option>
          ))}
        </select>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.actionCost.amount')}</label>
        <input className="ao-input" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.actionCost.condition')}</label>
        <input
          className="ao-input"
          placeholder='character_level >= 5'
          value={condition}
          onChange={(e) => {
            setCondition(e.target.value);
            setValidationMsg(null);
          }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !condition.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function DamageRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useDamageRule(rule.id, true);
  const { data: damageTypes } = useDamageTypes();
  const save = useSaveDamageRule();
  const validate = useValidateFormula();

  const [dice, setDice] = useState('');
  const [flat, setFlat] = useState('');
  const [damageTypeId, setDamageTypeId] = useState('');
  const [requiresAttackHit, setRequiresAttackHit] = useState(false);
  const [requiresSave, setRequiresSave] = useState(false);
  const [halfOnSave, setHalfOnSave] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setDice(def.diceFormula ?? '');
      setFlat(def.flatFormula ?? '');
      setDamageTypeId(def.damageTypeId ?? '');
      setRequiresAttackHit(def.requiresAttackHit);
      setRequiresSave(def.requiresSave);
      setHalfOnSave(def.halfOnSave);
    }
  }, [def]);

  const onValidate = (expr: string, resultType: 'dice' | 'integer') => {
    if (!expr.trim()) return;
    validate.mutate(
      { expression: expr.trim(), resultType },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () =>
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        diceFormula: dice.trim() || null,
        flatFormula: flat.trim() || null,
        damageTypeId: damageTypeId || null,
        requiresAttackHit,
        requiresSave,
        halfOnSave,
      },
    });

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.damage.dice')}</label>
        <input className="ao-input" placeholder="2d6" value={dice} onChange={(e) => { setDice(e.target.value); setValidationMsg(null); }} />
        <button className="ao-btn" onClick={() => onValidate(dice, 'dice')} disabled={validate.isPending || !dice.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.damage.flat')}</label>
        <input className="ao-input" placeholder='ability_mod("STR")' value={flat} onChange={(e) => { setFlat(e.target.value); setValidationMsg(null); }} />
        <button className="ao-btn" onClick={() => onValidate(flat, 'integer')} disabled={validate.isPending || !flat.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.damage.type')}</label>
        <select className="ao-input" value={damageTypeId} onChange={(e) => setDamageTypeId(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.damage.typeNone')}</option>
          {(damageTypes ?? []).map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>
      </div>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={requiresAttackHit} onChange={(e) => setRequiresAttackHit(e.target.checked)} />
        {t('adm.ruleWorkbench.damage.requiresAttack')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={requiresSave} onChange={(e) => setRequiresSave(e.target.checked)} />
        {t('adm.ruleWorkbench.damage.requiresSave')}
      </label>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={halfOnSave} onChange={(e) => setHalfOnSave(e.target.checked)} />
        {t('adm.ruleWorkbench.damage.halfOnSave')}
      </label>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
    </div>
  );
}

function ResourceRuleEditor({ rule, featureId }: { rule: FeatureRuleResponse; featureId: string }) {
  const t = useT();
  const { data: def } = useResourceDefinition(rule.id, true);
  const save = useSaveResourceDefinition();
  const validate = useValidateFormula();

  const [resourceKey, setResourceKey] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [maxFormula, setMaxFormula] = useState('');
  const [resetRestType, setResetRestType] = useState('');
  const [allowNegative, setAllowNegative] = useState(false);
  const [validationMsg, setValidationMsg] = useState<string | null>(null);

  useEffect(() => {
    if (def) {
      setResourceKey(def.resourceKey ?? '');
      setDisplayName(def.displayName ?? '');
      setMaxFormula(def.maxFormula ?? '');
      setResetRestType(def.resetRestType ?? '');
      setAllowNegative(def.allowNegative);
    }
  }, [def]);

  const onValidate = () => {
    if (!maxFormula.trim()) return;
    validate.mutate(
      { expression: maxFormula.trim(), resultType: 'integer' },
      {
        onSuccess: (res) => {
          const v = res.data;
          setValidationMsg(v?.valid ? t('adm.ruleWorkbench.resource.formulaOk') : v?.message || t('adm.ruleWorkbench.card.validFail'));
        },
      },
    );
  };

  const onSave = () => {
    if (!resourceKey.trim()) {
      toast.error(t('adm.ruleWorkbench.resource.keyRequired'));
      return;
    }
    save.mutate({
      ruleId: rule.id,
      featureId,
      data: {
        resourceKey: resourceKey.trim(),
        displayName: displayName.trim() || undefined,
        maxFormula: maxFormula.trim() || undefined,
        resetRestType: resetRestType || undefined,
        allowNegative,
      },
    });
  };

  return (
    <div className={s.editor}>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resource.key')}</label>
        <input className="ao-input" value={resourceKey} placeholder="rage" onChange={(e) => setResourceKey(e.target.value)} />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resource.name')}</label>
        <input
          className="ao-input"
          value={displayName}
          placeholder={t('adm.ruleWorkbench.resource.namePlaceholder')}
          onChange={(e) => setDisplayName(e.target.value)}
        />
      </div>
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resource.maxFormula')}</label>
        <input
          className="ao-input"
          value={maxFormula}
          placeholder='ability_mod("INT")'
          onChange={(e) => {
            setMaxFormula(e.target.value);
            setValidationMsg(null);
          }}
        />
        <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !maxFormula.trim()}>
          {t('adm.ruleWorkbench.card.validate')}
        </button>
      </div>
      {validationMsg && <p className={s.muted}>{validationMsg}</p>}
      <div className={s.editorRow}>
        <label className={s.editorLabel}>{t('adm.ruleWorkbench.resource.reset')}</label>
        <select className="ao-input" value={resetRestType} onChange={(e) => setResetRestType(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.resource.resetNone')}</option>
          <option value="short_rest">{t('adm.ruleWorkbench.resource.resetShort')}</option>
          <option value="long_rest">{t('adm.ruleWorkbench.resource.resetLong')}</option>
        </select>
      </div>
      <label className={s.editorCheck}>
        <input type="checkbox" checked={allowNegative} onChange={(e) => setAllowNegative(e.target.checked)} />
        {t('adm.ruleWorkbench.resource.allowNegative')}
      </label>
      <div className={s.editorActions}>
        <button className="ao-btn ao-btn--primary" onClick={onSave} disabled={save.isPending}>
          {t('adm.ruleWorkbench.resource.save')}
        </button>
      </div>
      <p className={s.muted}>{t('adm.ruleWorkbench.resource.hint')}</p>
    </div>
  );
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

          <p className="ao-overline">{t('adm.ruleWorkbench.readme.formulaTitle')}</p>
          <p>{t('adm.ruleWorkbench.readme.formulaIntro')}</p>
          <ul className={s.readmeSteps}>
            <li>{t('adm.ruleWorkbench.readme.formulaVars')}</li>
            <li>{t('adm.ruleWorkbench.readme.formulaFns')}</li>
            <li>{t('adm.ruleWorkbench.readme.formulaOps')}</li>
          </ul>
          <p className={s.muted}>{t('adm.ruleWorkbench.readme.formulaExamples')}</p>
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
            <option key={o.code} value={o.code}>{localizedCode(t, 'status', o.code, o.label)}</option>
          ))}
        </select>
        <select className="ao-input" value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">{t('adm.ruleWorkbench.filter.allSeverities')}</option>
          {metadata?.severities.map((o) => (
            <option key={o.code} value={o.code}>{localizedCode(t, 'severity', o.code, o.label)}</option>
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
                          <span className={cn(s.badge, s.sevError)}>{localizedCode(t, 'severity', 'error')}</span>
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
  const [editRuleId, setEditRuleId] = useState<string | null>(null);

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
                  {rule.hasUnresolvedError && <span className={cn(s.badge, s.sevError)}>{localizedCode(t, 'severity', 'error')}</span>}
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
                  <button
                    className="ao-btn"
                    onClick={() => setEditRuleId(editRuleId === rule.id ? null : rule.id)}
                  >
                    <Sliders size={14} /> {t('adm.ruleWorkbench.resource.configure')}
                  </button>
                </div>
                {historyOpen && (
                  <div className={s.historyBlock}>
                    <RuleRevisions ruleId={rule.id} featureId={featureId} />
                  </div>
                )}
                {editRuleId === rule.id && (
                  <div className={s.historyBlock}>
                    <RuleMechanicsEditor rule={rule} featureId={featureId} />
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
                <span className={s.issueType}>{localizedCode(t, 'issueType', issue.issueType)}</span>
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
            <option key={o.code} value={o.code}>{localizedCode(t, 'issueType', o.code, o.label)}</option>
          ))}
        </select>
        <select
          className="ao-input"
          value={severity}
          onChange={(e) => setSeverity(e.target.value as FeatureRuleSeverity | '')}
        >
          <option value="">{t('adm.ruleWorkbench.card.pickSeverity')}</option>
          {metadata?.severities.map((o) => (
            <option key={o.code} value={o.code}>{localizedCode(t, 'severity', o.code, o.label)}</option>
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
