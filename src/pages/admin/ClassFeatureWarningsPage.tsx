import { Fragment, useState } from 'react';
import { AlertTriangle, Check, SlidersHorizontal } from 'lucide-react';
import { useClassFeatureWarnings, useResolveClassFeature } from '@/hooks/useAdmin';
import { DetailStatus, ExpandChevron, ExpandableRow } from '@/components/common/ExpandableRow';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ClassFeatureWarningResponse } from '@/types';
import s from './SpellWarningsPage.module.css';

const ABILITIES = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'] as const;
const ACTIVATIONS = ['PASSIVE', 'ACTION', 'BONUS_ACTION', 'REACTION'] as const;
const DAMAGE_TYPES = ['SLASHING', 'PIERCING', 'BLUDGEONING', 'FIRE', 'COLD', 'LIGHTNING', 'POISON', 'NECROTIC', 'RADIANT', 'PSYCHIC', 'FORCE', 'THUNDER', 'ACID'] as const;

function Diamond() {
  return <span className={s.diamond} />;
}

function reasonLabel(code: string | null, t: ReturnType<typeof useT>): string {
  if (!code) return t('adm.classFeatureWarn.reasonUnknown');
  const key = `adm.classFeatureWarn.reason.${code}`;
  const label = t(key);
  return label === key ? t('adm.classFeatureWarn.reasonUnknown') : label;
}

function activationLabel(value: string | null, t: ReturnType<typeof useT>): string {
  return value ? t(`adm.classFeatureWarn.activation.${value}`) : '-';
}

function resolutionSummary(feature: ClassFeatureWarningResponse, t: ReturnType<typeof useT>): string {
  const parts: string[] = [];
  if (feature.damageDice) parts.push(`${t('adm.classFeatureWarn.damage')}: ${feature.damageDice}${feature.damageType ? ` ${feature.damageType}` : ''}`);
  if (feature.healingDice || feature.healingFlat) parts.push(`${t('adm.classFeatureWarn.healing')}: ${feature.healingDice ?? feature.healingFlat}`);
  if (feature.saveAbility) parts.push(`${t('adm.classFeatureWarn.save')}: ${t(`best.ability.${feature.saveAbility}`)}`);
  if (feature.attackRoll) parts.push(t('adm.classFeatureWarn.attackRoll'));
  return parts.length ? parts.join(' · ') : activationLabel(feature.activationType, t);
}

function WarningDetail({ feature }: { feature: ClassFeatureWarningResponse }) {
  const t = useT();
  const resolve = useResolveClassFeature();
  const [activationType, setActivationType] = useState(feature.activationType ?? 'PASSIVE');
  const [saveAbility, setSaveAbility] = useState(feature.saveAbility ?? '');
  const [attackRoll, setAttackRoll] = useState(!!feature.attackRoll);
  const [damageDice, setDamageDice] = useState(feature.damageDice ?? '');
  const [damageType, setDamageType] = useState(feature.damageType ?? '');
  const [healingDice, setHealingDice] = useState(feature.healingDice ?? '');
  const [healingFlat, setHealingFlat] = useState(feature.healingFlat?.toString() ?? '');
  const [keepFlag, setKeepFlag] = useState(false);

  const submit = () => {
    const flat = healingFlat.trim();
    resolve.mutate({
      id: feature.id,
      data: {
        activationType,
        saveAbility: saveAbility || null,
        attackRoll,
        damageDice: damageDice.trim() || null,
        damageType: damageType || null,
        healingDice: healingDice.trim() || null,
        healingFlat: flat ? Number(flat) : null,
        warning: keepFlag,
      },
    });
  };

  return (
    <div className={s.detail}>
      <div className={s.detailDesc}>
        <div className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.descLabel')}</div>
        <p className={s.descText}>{feature.description || '-'}</p>
      </div>

      <div className={s.editor}>
        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.activation')}</span>
          <select className={cn('ao-input', s.select)} value={activationType} onChange={(e) => setActivationType(e.target.value)}>
            {ACTIVATIONS.map((a) => (
              <option key={a} value={a} className={s.option}>{activationLabel(a, t)}</option>
            ))}
          </select>
        </label>

        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.save')}</span>
          <select className={cn('ao-input', s.select)} value={saveAbility} onChange={(e) => setSaveAbility(e.target.value)}>
            <option value="" className={s.option}>{t('adm.classFeatureWarn.none')}</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a} className={s.option}>{t(`best.ability.${a}`)}</option>
            ))}
          </select>
        </label>

        <label className={s.checkRow}>
          <input type="checkbox" checked={attackRoll} onChange={(e) => setAttackRoll(e.target.checked)} />
          <span>{t('adm.classFeatureWarn.attackRoll')}</span>
        </label>

        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.damage')}</span>
          <input className="ao-input" value={damageDice} onChange={(e) => setDamageDice(e.target.value)} placeholder="1d6" />
        </label>

        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.damageType')}</span>
          <select className={cn('ao-input', s.select)} value={damageType} onChange={(e) => setDamageType(e.target.value)}>
            <option value="" className={s.option}>{t('adm.classFeatureWarn.none')}</option>
            {DAMAGE_TYPES.map((d) => (
              <option key={d} value={d} className={s.option}>{d}</option>
            ))}
          </select>
        </label>

        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.healingDice')}</span>
          <input className="ao-input" value={healingDice} onChange={(e) => setHealingDice(e.target.value)} placeholder="1d10" />
        </label>

        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.classFeatureWarn.healingFlat')}</span>
          <input className="ao-input" type="number" min="0" value={healingFlat} onChange={(e) => setHealingFlat(e.target.value)} />
        </label>

        <label className={s.checkRow}>
          <input type="checkbox" checked={keepFlag} onChange={(e) => setKeepFlag(e.target.checked)} />
          <span>{t('adm.classFeatureWarn.keepFlag')}</span>
        </label>

        <button className="ao-btn ao-btn--primary" disabled={resolve.isPending} onClick={submit}>
          <Check size={13} /> {keepFlag ? t('adm.classFeatureWarn.saveBtn') : t('adm.classFeatureWarn.resolve')}
        </button>
      </div>
    </div>
  );
}

export default function ClassFeatureWarningsPage() {
  const t = useT();
  const { data: rows = [], isLoading, isError } = useClassFeatureWarnings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <AlertTriangle size={18} className={s.headerIcon} />
          <div>
            <div className={s.headerTitle}>{t('adm.classFeatureWarn.title')}</div>
            <div className={s.headerSub}>{t('adm.classFeatureWarn.subtitle')}</div>
          </div>
        </div>
        <span className={s.count}>
          <SlidersHorizontal size={13} /> {t('adm.classFeatureWarn.count', { n: rows.length })}
        </span>
      </header>

      <div className={s.body}>
        <div className={cn('ao-panel', s.tablePanel)}>
          <table className={cn('ao-table bd-table', s.table)}>
            <thead>
              <tr>
                <th>{t('adm.classFeatureWarn.colFeature')}</th>
                <th className={s.colLevel}>{t('adm.classFeatureWarn.colLevel')}</th>
                <th>{t('adm.classFeatureWarn.colResolution')}</th>
                <th className={s.colReason}>{t('adm.classFeatureWarn.colReason')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((feature) => {
                const isOpen = expandedId === feature.id;
                const toggle = () => setExpandedId(isOpen ? null : feature.id);
                return (
                  <Fragment key={feature.id}>
                    <tr className={cn(s.row, isOpen && s.rowOpen)}>
                      <td onClick={toggle}>
                        <div className={s.spellCell}>
                          <ExpandChevron open={isOpen} />
                          <Diamond />
                          <div className={s.spellMeta}>
                            <div className={s.spellName}>{feature.title}</div>
                            <div className={s.spellSub}>
                              {feature.className ?? '-'}{feature.subclassName ? ` · ${feature.subclassName}` : ''} · {feature.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={s.center} onClick={toggle}>
                        <span className={s.level}>{feature.level ?? '-'}</span>
                      </td>
                      <td onClick={toggle}><span className={s.saveTag}>{resolutionSummary(feature, t)}</span></td>
                      <td onClick={toggle}><span className={s.reason}>{reasonLabel(feature.warningReason, t)}</span></td>
                    </tr>
                    <ExpandableRow open={isOpen} colSpan={4}><WarningDetail feature={feature} /></ExpandableRow>
                  </Fragment>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={4} className={s.emptyCell}>{isError ? t('adm.classFeatureWarn.loadError') : t('adm.classFeatureWarn.empty')}</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={4} className={s.emptyCell}><DetailStatus>{t('adm.classFeatureWarn.loading')}</DetailStatus></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
