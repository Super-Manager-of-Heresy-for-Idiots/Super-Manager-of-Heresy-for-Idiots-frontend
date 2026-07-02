import { Fragment, useState } from 'react';
import { AlertTriangle, Check, SlidersHorizontal } from 'lucide-react';
import { useSpellWarnings, useResolveSpell } from '@/hooks/useAdmin';
import { DetailStatus, ExpandChevron, ExpandableRow } from '@/components/common/ExpandableRow';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { SpellWarningResponse } from '@/types';
import s from './SpellWarningsPage.module.css';

const ABILITIES = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'] as const;

function Diamond() {
  return <span className={s.diamond} />;
}

function reasonLabel(code: string | null, t: ReturnType<typeof useT>): string {
  if (!code) return t('adm.spellWarn.reasonUnknown');
  const key = `adm.spellWarn.reason.${code}`;
  const label = t(key);
  return label === key ? t('adm.spellWarn.reasonUnknown') : label;
}

/** Editor revealed when a flagged spell is expanded: shows the full description and
    lets the admin set the saving-throw ability / attack flag and clear the warning. */
function WarningDetail({ spell }: { spell: SpellWarningResponse }) {
  const t = useT();
  const resolve = useResolveSpell();
  const [saveAbility, setSaveAbility] = useState(spell.saveAbility ?? '');
  const [attackRoll, setAttackRoll] = useState(!!spell.attackRoll);
  const [keepFlag, setKeepFlag] = useState(false);

  const submit = () => {
    resolve.mutate({
      id: spell.id,
      data: { saveAbility: saveAbility || null, attackRoll, warning: keepFlag },
    });
  };

  return (
    <div className={s.detail}>
      <div className={s.detailDesc}>
        <div className={cn('ao-overline', s.detailLabel)}>{t('adm.spellWarn.descLabel')}</div>
        <p className={s.descText}>{spell.description || '—'}</p>
      </div>

      <div className={s.editor}>
        <label className={s.field}>
          <span className={cn('ao-overline', s.detailLabel)}>{t('adm.spellWarn.colSave')}</span>
          <select className={cn('ao-input', s.select)} value={saveAbility} onChange={(e) => setSaveAbility(e.target.value)}>
            <option value="" className={s.option}>{t('adm.spellWarn.saveNone')}</option>
            {ABILITIES.map((a) => (
              <option key={a} value={a} className={s.option}>{t(`best.ability.${a}`)}</option>
            ))}
          </select>
        </label>

        <label className={s.checkRow}>
          <input type="checkbox" checked={attackRoll} onChange={(e) => setAttackRoll(e.target.checked)} />
          <span>{t('adm.spellWarn.attackRoll')}</span>
        </label>

        <label className={s.checkRow}>
          <input type="checkbox" checked={keepFlag} onChange={(e) => setKeepFlag(e.target.checked)} />
          <span>{t('adm.spellWarn.keepFlag')}</span>
        </label>

        <button className="ao-btn ao-btn--primary" disabled={resolve.isPending} onClick={submit}>
          <Check size={13} /> {keepFlag ? t('adm.spellWarn.save') : t('adm.spellWarn.resolve')}
        </button>
      </div>
    </div>
  );
}

export default function SpellWarningsPage() {
  const t = useT();
  const { data: rows = [], isLoading, isError } = useSpellWarnings();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <AlertTriangle size={18} className={s.headerIcon} />
          <div>
            <div className={s.headerTitle}>{t('adm.spellWarn.title')}</div>
            <div className={s.headerSub}>{t('adm.spellWarn.subtitle')}</div>
          </div>
        </div>
        <span className={s.count}>
          <SlidersHorizontal size={13} /> {t('adm.spellWarn.count', { n: rows.length })}
        </span>
      </header>

      <div className={s.body}>
        <div className={cn('ao-panel', s.tablePanel)}>
          <table className={cn('ao-table bd-table', s.table)}>
            <thead>
              <tr>
                <th>{t('adm.spellWarn.colSpell')}</th>
                <th className={s.colLevel}>{t('adm.spellWarn.colLevel')}</th>
                <th className={s.colSave}>{t('adm.spellWarn.colSave')}</th>
                <th className={s.colReason}>{t('adm.spellWarn.colReason')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((sp) => {
                const isOpen = expandedId === sp.id;
                const toggle = () => setExpandedId(isOpen ? null : sp.id);
                const save = sp.saveAbility ? t(`best.ability.${sp.saveAbility}`) : (sp.attackRoll ? t('adm.spellWarn.attackRoll') : '—');
                return (
                  <Fragment key={sp.id}>
                    <tr className={cn(s.row, isOpen && s.rowOpen)}>
                      <td onClick={toggle}>
                        <div className={s.spellCell}>
                          <ExpandChevron open={isOpen} />
                          <Diamond />
                          <div className={s.spellMeta}>
                            <div className={s.spellName}>{sp.name}</div>
                            <div className={s.spellSub}>{sp.schoolName ?? '—'} · {sp.slug}</div>
                          </div>
                        </div>
                      </td>
                      <td className={s.center} onClick={toggle}>
                        <span className={s.level}>{sp.level === 0 ? t('adm.spellWarn.cantrip') : sp.level}</span>
                      </td>
                      <td onClick={toggle}><span className={s.saveTag}>{save}</span></td>
                      <td onClick={toggle}><span className={s.reason}>{reasonLabel(sp.warningReason, t)}</span></td>
                    </tr>
                    <ExpandableRow open={isOpen} colSpan={4}><WarningDetail spell={sp} /></ExpandableRow>
                  </Fragment>
                );
              })}
              {!isLoading && rows.length === 0 && (
                <tr><td colSpan={4} className={s.emptyCell}>{isError ? t('adm.spellWarn.loadError') : t('adm.spellWarn.empty')}</td></tr>
              )}
              {isLoading && (
                <tr><td colSpan={4} className={s.emptyCell}><DetailStatus>{t('adm.spellWarn.loading')}</DetailStatus></td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
