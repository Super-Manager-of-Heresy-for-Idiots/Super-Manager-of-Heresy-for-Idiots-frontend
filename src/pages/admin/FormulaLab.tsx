import { useState } from 'react';
import { FlaskConical, Play, ShieldCheck } from 'lucide-react';
import { ExpandChevron, ExpandablePanel } from '@/components/common/ExpandableRow';
import { usePreviewFormula, useValidateFormula } from '@/hooks/useFeatureRules';
import type {
  FeatureFormulaEvaluateResult,
  FeatureFormulaValidation,
  FormulaResultType,
  FormulaRoundingMode,
} from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './FormulaLab.module.css';

const RESULT_TYPES: FormulaResultType[] = ['integer', 'decimal', 'boolean', 'duration', 'dice', 'modifier'];
const ROUNDING: FormulaRoundingMode[] = ['floor', 'ceil', 'nearest', 'none'];
const SCALARS = ['character_level', 'proficiency_bonus', 'spell_slot_level', 'monster_cr', 'combat_round'] as const;

/** Standalone tester for the bounded formula DSL: validate against a result type + preview with a
 *  sample context. Formulas get attached to specialized rules from Stage 4 onwards. */
export default function FormulaLab() {
  const t = useT();
  const [open, setOpen] = useState(false);

  const [expression, setExpression] = useState('floor(class_level("Druid") / 2)');
  const [resultType, setResultType] = useState<FormulaResultType>('integer');
  const [rounding, setRounding] = useState<FormulaRoundingMode>('floor');
  const [scalars, setScalars] = useState<Record<string, string>>({});
  const [classKey, setClassKey] = useState('Druid');
  const [classVal, setClassVal] = useState('9');
  const [abilityKey, setAbilityKey] = useState('CHA');
  const [abilityVal, setAbilityVal] = useState('3');

  const validate = useValidateFormula();
  const preview = usePreviewFormula();
  const [validation, setValidation] = useState<FeatureFormulaValidation | null>(null);
  const [result, setResult] = useState<FeatureFormulaEvaluateResult | null>(null);

  const numMap = (map: Record<string, string>): Record<string, number> => {
    const out: Record<string, number> = {};
    Object.entries(map).forEach(([k, v]) => {
      if (v.trim() !== '' && Number.isFinite(Number(v))) out[k] = Number(v);
    });
    return out;
  };

  const onValidate = () => {
    setValidation(null);
    validate.mutate(
      { expression, resultType },
      { onSuccess: (res) => setValidation(res.data ?? null) },
    );
  };

  const onPreview = () => {
    setResult(null);
    const classLevels = classKey.trim() && classVal.trim() ? { [classKey.trim()]: Number(classVal) } : undefined;
    const abilityMods = abilityKey.trim() && abilityVal.trim() ? { [abilityKey.trim()]: Number(abilityVal) } : undefined;
    preview.mutate(
      {
        expression,
        resultType,
        roundingMode: rounding,
        context: { scalars: numMap(scalars), classLevels, abilityMods },
      },
      { onSuccess: (res) => setResult(res.data ?? null) },
    );
  };

  return (
    <div className={cn('ao-panel', s.lab)}>
      <button className={s.head} onClick={() => setOpen((o) => !o)}>
        <FlaskConical size={16} className={s.headIcon} />
        <span className="ao-overline">{t('adm.formulaLab.title')}</span>
        <ExpandChevron open={open} />
      </button>

      <ExpandablePanel open={open}>
        <div className={s.body}>
          <textarea
            className={cn('ao-input', s.expr)}
            rows={2}
            value={expression}
            onChange={(e) => setExpression(e.target.value)}
            placeholder={t('adm.formulaLab.exprPlaceholder')}
          />

          <div className={s.controls}>
            <label className={s.field}>
              <span className={s.label}>{t('adm.formulaLab.resultType')}</span>
              <select className="ao-input" value={resultType} onChange={(e) => setResultType(e.target.value as FormulaResultType)}>
                {RESULT_TYPES.map((rt) => <option key={rt} value={rt}>{rt}</option>)}
              </select>
            </label>
            <label className={s.field}>
              <span className={s.label}>{t('adm.formulaLab.rounding')}</span>
              <select className="ao-input" value={rounding} onChange={(e) => setRounding(e.target.value as FormulaRoundingMode)}>
                {ROUNDING.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </label>
          </div>

          <p className="ao-overline">{t('adm.formulaLab.context')}</p>
          <div className={s.contextGrid}>
            {SCALARS.map((name) => (
              <label key={name} className={s.field}>
                <span className={s.label}>{name}</span>
                <input
                  className="ao-input"
                  type="number"
                  value={scalars[name] ?? ''}
                  onChange={(e) => setScalars((prev) => ({ ...prev, [name]: e.target.value }))}
                />
              </label>
            ))}
            <label className={s.field}>
              <span className={s.label}>class_level</span>
              <div className="ao-row ao-gap-4">
                <input className="ao-input" value={classKey} onChange={(e) => setClassKey(e.target.value)} placeholder="key" />
                <input className="ao-input" type="number" value={classVal} onChange={(e) => setClassVal(e.target.value)} placeholder="lvl" />
              </div>
            </label>
            <label className={s.field}>
              <span className={s.label}>ability_mod</span>
              <div className="ao-row ao-gap-4">
                <input className="ao-input" value={abilityKey} onChange={(e) => setAbilityKey(e.target.value)} placeholder="key" />
                <input className="ao-input" type="number" value={abilityVal} onChange={(e) => setAbilityVal(e.target.value)} placeholder="mod" />
              </div>
            </label>
          </div>

          <div className={s.actions}>
            <button className="ao-btn" onClick={onValidate} disabled={validate.isPending || !expression.trim()}>
              <ShieldCheck size={14} /> {t('adm.formulaLab.validate')}
            </button>
            <button className="ao-btn" onClick={onPreview} disabled={preview.isPending || !expression.trim()}>
              <Play size={14} /> {t('adm.formulaLab.preview')}
            </button>
          </div>

          {validation && (
            <div className={cn(s.result, validation.valid ? s.ok : s.bad)}>
              <strong>{validation.valid ? t('adm.formulaLab.valid') : t('adm.formulaLab.invalid')}</strong>
              {validation.message && <span> — {validation.message}</span>}
              {validation.sampleResult && <span> · {t('adm.formulaLab.sample')}: {validation.sampleResult}</span>}
              {validation.requiredContext && validation.requiredContext.length > 0 && (
                <div className={s.chips}>
                  {validation.requiredContext.map((c) => <span key={c} className={s.chip}>{c}</span>)}
                </div>
              )}
            </div>
          )}

          {result && (
            <div className={cn(s.result, result.ok ? s.ok : s.bad)}>
              <strong>{result.ok ? t('adm.formulaLab.result') : t('adm.formulaLab.error')}</strong>
              {result.ok ? <span> — {result.displayValue}</span> : <span> — {result.message}</span>}
            </div>
          )}
        </div>
      </ExpandablePanel>
    </div>
  );
}
