import { Fragment, useMemo, useRef, useState } from 'react';
import { Check, Plus, Trash2, Wand2, Search, AlertTriangle } from 'lucide-react';
import { useSpells, useDamageTypes } from '@/hooks/useContentCatalog';
import { useProficiencySkills } from '@/hooks/useBestiary';
import { useUpdateSpell } from '@/hooks/useAdmin';
import { DetailStatus, ExpandChevron, ExpandableRow } from '@/components/common/ExpandableRow';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { ContentLabel, SpellDetail, UpdateSpellRequest } from '@/types';
import s from './SpellEditorPage.module.css';

const ABILITIES = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'] as const;
const DICE_RE = /^\s*\d+\s*[dдкDДК]\s*\d+\s*$/;

type DamageRow = { k: number; dice: string; damageTypeSlug: string; raw: string };
type HealRow = { k: number; dice: string; flat: string; raw: string };

/** Snapshot of the editable fields, used to detect the dirty state. */
function snapshot(save: string, attack: boolean, chkAb: string, chkSk: string, warn: boolean,
  dmg: DamageRow[], heal: HealRow[]): string {
  return JSON.stringify({
    save, attack, chkAb, chkSk, warn,
    dmg: dmg.map((d) => [d.dice.trim(), d.damageTypeSlug, d.raw.trim()]),
    heal: heal.map((h) => [h.dice.trim(), h.flat.trim(), h.raw.trim()]),
  });
}

function SpellEditor({ spell, damageTypes, skills }: {
  spell: SpellDetail;
  damageTypes: ContentLabel[];
  skills: { name: string }[];
}) {
  const t = useT();
  const update = useUpdateSpell();
  const nextKey = useRef(0);
  const key = () => nextKey.current++;

  const [saveAbility, setSaveAbility] = useState(spell.saveAbility ?? '');
  const [attackRoll, setAttackRoll] = useState(!!spell.attackRoll);
  const [checkAbility, setCheckAbility] = useState(spell.checkAbility ?? '');
  const [checkSkill, setCheckSkill] = useState(spell.checkSkill ?? '');
  const [warning, setWarning] = useState(!!spell.warning);
  const [damages, setDamages] = useState<DamageRow[]>(
    () => (spell.damage ?? []).map((d) => ({ k: key(), dice: d.dice ?? '', damageTypeSlug: d.damageType?.slug ?? '', raw: d.raw ?? '' })),
  );
  const [healings, setHealings] = useState<HealRow[]>(
    () => (spell.healing ?? []).map((h) => ({ k: key(), dice: h.dice ?? '', flat: h.flat != null ? String(h.flat) : '', raw: h.raw ?? '' })),
  );

  // Baseline for dirty detection; advanced to the saved values after a successful save.
  const [baseline, setBaseline] = useState(() =>
    snapshot(spell.saveAbility ?? '', !!spell.attackRoll, spell.checkAbility ?? '', spell.checkSkill ?? '', !!spell.warning,
      (spell.damage ?? []).map((d) => ({ k: 0, dice: d.dice ?? '', damageTypeSlug: d.damageType?.slug ?? '', raw: d.raw ?? '' })),
      (spell.healing ?? []).map((h) => ({ k: 0, dice: h.dice ?? '', flat: h.flat != null ? String(h.flat) : '', raw: h.raw ?? '' }))));

  const current = snapshot(saveAbility, attackRoll, checkAbility, checkSkill, warning, damages, healings);
  const dirty = current !== baseline;

  const diceInvalid = (v: string) => v.trim() !== '' && !DICE_RE.test(v);
  const flatInvalid = (v: string) => v.trim() !== '' && !/^\d+$/.test(v.trim());
  const hasErrors =
    damages.some((d) => diceInvalid(d.dice)) ||
    healings.some((h) => diceInvalid(h.dice) || flatInvalid(h.flat)) ||
    (!!checkSkill.trim() && !checkAbility); // a skill without an ability is meaningless

  const submit = () => {
    const data: UpdateSpellRequest = {
      saveAbility: saveAbility || null,
      attackRoll,
      checkAbility: checkAbility || null,
      checkSkill: checkAbility ? (checkSkill.trim() || null) : null,
      warning,
      damages: damages
        .filter((d) => d.dice.trim() || d.raw.trim() || d.damageTypeSlug)
        .map((d) => ({ dice: d.dice.trim() || null, damageTypeSlug: d.damageTypeSlug || null, raw: d.raw.trim() || null })),
      healings: healings
        .filter((h) => h.dice.trim() || h.flat.trim() || h.raw.trim())
        .map((h) => ({ dice: h.dice.trim() || null, flat: h.flat.trim() ? Number(h.flat) : null, raw: h.raw.trim() || null })),
    };
    update.mutate({ id: spell.id, data }, { onSuccess: () => setBaseline(current) });
  };

  return (
    <div className={s.editor}>
      {spell.description && (
        <div className={s.descBox}>
          <div className={cn('ao-overline', s.groupLabel)}>{t('adm.spellEdit.description')}</div>
          <p className={s.descText}>{spell.description}</p>
        </div>
      )}

      {/* Resolution: save / attack / check */}
      <div className={s.group}>
        <div className={cn('ao-overline', s.groupLabel)}>{t('adm.spellEdit.resolution')}</div>
        <div className={s.resolveGrid}>
          <label className={s.field}>
            <span className={s.fieldLabel}>{t('adm.spellEdit.save')}</span>
            <select className={cn('ao-input', s.control)} value={saveAbility} onChange={(e) => setSaveAbility(e.target.value)}>
              <option value="">{t('adm.spellEdit.none')}</option>
              {ABILITIES.map((a) => <option key={a} value={a}>{t(`best.ability.${a}`)}</option>)}
            </select>
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>{t('adm.spellEdit.checkAbility')}</span>
            <select className={cn('ao-input', s.control)} value={checkAbility} onChange={(e) => setCheckAbility(e.target.value)}>
              <option value="">{t('adm.spellEdit.none')}</option>
              {ABILITIES.map((a) => <option key={a} value={a}>{t(`best.ability.${a}`)}</option>)}
            </select>
          </label>

          <label className={s.field}>
            <span className={s.fieldLabel}>{t('adm.spellEdit.checkSkill')}</span>
            <input
              className={cn('ao-input', s.control)}
              list={`skills-${spell.id}`}
              value={checkSkill}
              disabled={!checkAbility}
              placeholder={checkAbility ? t('adm.spellEdit.checkSkillPh') : t('adm.spellEdit.checkSkillDisabled')}
              onChange={(e) => setCheckSkill(e.target.value)}
            />
            <datalist id={`skills-${spell.id}`}>
              {skills.map((sk) => <option key={sk.name} value={sk.name} />)}
            </datalist>
          </label>

          <label className={cn(s.checkRow, s.attackToggle)}>
            <input type="checkbox" checked={attackRoll} onChange={(e) => setAttackRoll(e.target.checked)} />
            <span>{t('adm.spellEdit.attackRoll')}</span>
          </label>
        </div>
      </div>

      {/* Damage rows */}
      <div className={s.group}>
        <div className={s.groupHead}>
          <span className={cn('ao-overline', s.groupLabel)}>{t('adm.spellEdit.damage')}</span>
          <button type="button" className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setDamages((r) => [...r, { k: key(), dice: '', damageTypeSlug: '', raw: '' }])}>
            <Plus size={13} /> {t('adm.spellEdit.addRow')}
          </button>
        </div>
        {damages.length === 0 && <div className={s.emptyRow}>{t('adm.spellEdit.noDamage')}</div>}
        {damages.map((d, i) => (
          <div key={d.k} className={s.rowEdit}>
            <input
              className={cn('ao-input', s.dice, diceInvalid(d.dice) && s.invalid)}
              placeholder="2d6" value={d.dice}
              onChange={(e) => setDamages((r) => r.map((x, j) => j === i ? { ...x, dice: e.target.value } : x))}
            />
            <select
              className={cn('ao-input', s.typeSel)} value={d.damageTypeSlug}
              onChange={(e) => setDamages((r) => r.map((x, j) => j === i ? { ...x, damageTypeSlug: e.target.value } : x))}
            >
              <option value="">{t('adm.spellEdit.typeless')}</option>
              {damageTypes.filter((dt) => dt.slug).map((dt) => <option key={dt.slug} value={dt.slug}>{dt.name}</option>)}
            </select>
            <input
              className={cn('ao-input', s.raw)} placeholder={t('adm.spellEdit.rawPh')} value={d.raw}
              onChange={(e) => setDamages((r) => r.map((x, j) => j === i ? { ...x, raw: e.target.value } : x))}
            />
            <button type="button" className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.removeBtn)} aria-label={t('adm.spellEdit.removeRow')}
              onClick={() => setDamages((r) => r.filter((_, j) => j !== i))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Healing rows */}
      <div className={s.group}>
        <div className={s.groupHead}>
          <span className={cn('ao-overline', s.groupLabel)}>{t('adm.spellEdit.healing')}</span>
          <button type="button" className="ao-btn ao-btn--ghost ao-btn--sm" onClick={() => setHealings((r) => [...r, { k: key(), dice: '', flat: '', raw: '' }])}>
            <Plus size={13} /> {t('adm.spellEdit.addRow')}
          </button>
        </div>
        {healings.length === 0 && <div className={s.emptyRow}>{t('adm.spellEdit.noHealing')}</div>}
        {healings.map((h, i) => (
          <div key={h.k} className={s.rowEdit}>
            <input
              className={cn('ao-input', s.dice, diceInvalid(h.dice) && s.invalid)}
              placeholder="2d8" value={h.dice}
              onChange={(e) => setHealings((r) => r.map((x, j) => j === i ? { ...x, dice: e.target.value } : x))}
            />
            <input
              className={cn('ao-input', s.flat, flatInvalid(h.flat) && s.invalid)}
              placeholder={t('adm.spellEdit.flat')} inputMode="numeric" value={h.flat}
              onChange={(e) => setHealings((r) => r.map((x, j) => j === i ? { ...x, flat: e.target.value } : x))}
            />
            <input
              className={cn('ao-input', s.raw)} placeholder={t('adm.spellEdit.rawPh')} value={h.raw}
              onChange={(e) => setHealings((r) => r.map((x, j) => j === i ? { ...x, raw: e.target.value } : x))}
            />
            <button type="button" className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.removeBtn)} aria-label={t('adm.spellEdit.removeRow')}
              onClick={() => setHealings((r) => r.filter((_, j) => j !== i))}>
              <Trash2 size={13} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer: warning + save */}
      <div className={s.footer}>
        <label className={s.checkRow}>
          <input type="checkbox" checked={warning} onChange={(e) => setWarning(e.target.checked)} />
          <span>{t('adm.spellEdit.keepFlag')}</span>
        </label>
        <div className={s.footerRight}>
          {hasErrors && <span className={s.errText}>{t('adm.spellEdit.fixErrors')}</span>}
          {dirty && !hasErrors && <span className={s.dirtyDot}>{t('adm.spellEdit.unsaved')}</span>}
          <button className="ao-btn ao-btn--primary" disabled={!dirty || hasErrors || update.isPending} onClick={submit}>
            <Check size={13} /> {update.isPending ? t('adm.spellEdit.saving') : t('adm.spellEdit.saveBtn')}
          </button>
        </div>
      </div>
    </div>
  );
}

function resolutionSummary(sp: SpellDetail, t: ReturnType<typeof useT>): string {
  const parts: string[] = [];
  if (sp.saveAbility) parts.push(`${t('adm.spellEdit.save')}: ${t(`best.ability.${sp.saveAbility}`)}`);
  if (sp.attackRoll) parts.push(t('adm.spellEdit.attackRoll'));
  if (sp.checkAbility) parts.push(`${t('adm.spellEdit.check')}: ${t(`best.ability.${sp.checkAbility}`)}`);
  if ((sp.damage ?? []).length) parts.push(`${t('adm.spellEdit.damage')} ×${sp.damage.length}`);
  if ((sp.healing ?? []).length) parts.push(`${t('adm.spellEdit.healing')} ×${sp.healing.length}`);
  return parts.length ? parts.join(' · ') : '—';
}

export default function SpellEditorPage() {
  const t = useT();
  const { data: spells = [], isLoading, isError } = useSpells();
  const { data: damageTypes = [] } = useDamageTypes();
  const { data: skills = [] } = useProficiencySkills();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [level, setLevel] = useState<string>('');
  const [onlyWarnings, setOnlyWarnings] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return spells
      .filter((sp) => !onlyWarnings || sp.warning)
      .filter((sp) => level === '' || String(sp.level ?? 0) === level)
      .filter((sp) => !q || sp.name.toLowerCase().includes(q) || sp.slug.toLowerCase().includes(q))
      .sort((a, b) => (a.level ?? 0) - (b.level ?? 0) || a.name.localeCompare(b.name));
  }, [spells, query, level, onlyWarnings]);

  const warnCount = useMemo(() => spells.filter((sp) => sp.warning).length, [spells]);

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headerLeft}>
          <Wand2 size={18} className={s.headerIcon} />
          <div>
            <div className={s.headerTitle}>{t('adm.spellEdit.title')}</div>
            <div className={s.headerSub}>{t('adm.spellEdit.subtitle')}</div>
          </div>
        </div>
        <span className={s.count}>{t('adm.spellEdit.count', { n: filtered.length })}</span>
      </header>

      <div className={s.toolbar}>
        <div className={s.searchWrap}>
          <Search size={14} className={s.searchIcon} />
          <input className={cn('ao-input', s.search)} placeholder={t('adm.spellEdit.searchPh')}
            value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <select className={cn('ao-input', s.levelSel)} value={level} onChange={(e) => setLevel(e.target.value)}>
          <option value="">{t('adm.spellEdit.allLevels')}</option>
          <option value="0">{t('adm.spellEdit.cantrip')}</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((l) => <option key={l} value={String(l)}>{t('adm.spellEdit.levelN', { n: l })}</option>)}
        </select>
        <button type="button" className={cn('ao-btn ao-btn--sm', onlyWarnings ? 'ao-btn--primary' : 'ao-btn--ghost')}
          onClick={() => setOnlyWarnings((v) => !v)}>
          <AlertTriangle size={13} /> {t('adm.spellEdit.onlyWarnings', { n: warnCount })}
        </button>
      </div>

      <div className={cn('ao-panel', s.tablePanel)}>
        <table className={cn('ao-table bd-table', s.table)}>
          <thead>
            <tr>
              <th>{t('adm.spellEdit.colSpell')}</th>
              <th className={s.colLevel}>{t('adm.spellEdit.colLevel')}</th>
              <th className={s.colResolve}>{t('adm.spellEdit.colResolution')}</th>
              <th className={s.colFlag} />
            </tr>
          </thead>
          <tbody>
            {filtered.map((sp) => {
              const isOpen = expandedId === sp.id;
              const toggle = () => setExpandedId(isOpen ? null : sp.id);
              return (
                <Fragment key={sp.id}>
                  <tr className={cn(s.row, isOpen && s.rowOpen)}>
                    <td onClick={toggle}>
                      <div className={s.spellCell}>
                        <ExpandChevron open={isOpen} />
                        <div className={s.spellMeta}>
                          <div className={s.spellName}>{sp.name}</div>
                          <div className={s.spellSub}>{sp.school?.name ?? '—'} · {sp.slug}</div>
                        </div>
                      </div>
                    </td>
                    <td className={s.center} onClick={toggle}>
                      <span className={s.level}>{sp.level === 0 ? t('adm.spellEdit.cantrip') : sp.level}</span>
                    </td>
                    <td onClick={toggle}><span className={s.resolve}>{resolutionSummary(sp, t)}</span></td>
                    <td className={s.center} onClick={toggle}>
                      {sp.warning && <AlertTriangle size={14} className={s.flagIcon} />}
                    </td>
                  </tr>
                  <ExpandableRow open={isOpen} colSpan={4}>
                    <SpellEditor spell={sp} damageTypes={damageTypes} skills={skills} />
                  </ExpandableRow>
                </Fragment>
              );
            })}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={4} className={s.emptyCell}>{isError ? t('adm.spellEdit.loadError') : t('adm.spellEdit.empty')}</td></tr>
            )}
            {isLoading && (
              <tr><td colSpan={4} className={s.emptyCell}><DetailStatus>{t('adm.spellEdit.loading')}</DetailStatus></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
