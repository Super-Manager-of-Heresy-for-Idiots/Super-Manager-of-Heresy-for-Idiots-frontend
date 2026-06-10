import React, { useState } from 'react';
import { Plus, X, ChevronDown, Save, Ban, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import type { DictionaryEntryResponse, DictionaryKind, MonsterRequest, MonsterScope } from '@/types';
import {
  ABILITY_SCORE_FIELDS,
  SECTION_PRESETS,
  abilityOptions,
  abilityShortKey,
  damageTypeOptions,
  sectionKey,
  sizeOptions,
  type TFunc,
} from './constants';
import {
  buildMonsterRequest,
  rowUid,
  type FeatureDamageFormRow,
  type FeatureFormRow,
  type MonsterFormState,
} from './serialize';

type Dicts = Record<DictionaryKind, DictionaryEntryResponse[]>;
type SkillOpt = { id: string; name: string };

interface Props {
  initial: MonsterFormState;
  dictionaries: Dicts;
  skills: SkillOpt[];
  scope: MonsterScope;
  contextLabel: string;
  submitting?: boolean;
  onSubmit: (req: MonsterRequest) => void;
  onCancel: () => void;
}

// ===== Ordo primitives =====
function Diamond({ size = 8, color = 'var(--gold)' }: { size?: number; color?: string }) {
  return <span style={{ width: size, height: size, transform: 'rotate(45deg)', background: color, display: 'inline-block', flexShrink: 0 }} />;
}
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className="ao-label" style={{ marginBottom: 6 }}>{children}{required && <span style={{ color: 'var(--ember)' }}> *</span>}</label>;
}
function Text({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input className="ao-input" value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} style={mono ? { fontFamily: 'var(--font-mono)' } : undefined} />;
}
function Num({ value, onChange, w }: { value: string; onChange: (v: string) => void; w?: number }) {
  return <input className="ao-input" type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', width: w }} />;
}
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; placeholder?: string }) {
  return (
    <select className="ao-input" value={value ?? ''} onChange={(e) => onChange(e.target.value)}
      style={{ appearance: 'none', cursor: 'pointer', paddingRight: 30, backgroundImage: "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23968c75' stroke-width='2'><path d='M6 9l6 6 6-6'/></svg>\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}>
      {placeholder && <option value="" style={{ background: 'var(--abyss)' }}>{placeholder}</option>}
      {options.map((o) => <option key={o.v} value={o.v} style={{ background: 'var(--abyss)' }}>{o.label}</option>)}
    </select>
  );
}
function Check({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} style={{ display: 'inline-flex', alignItems: 'center', gap: 9, background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}>
      <span style={{ width: 18, height: 18, border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, background: on ? 'var(--gold-deep)' : 'var(--abyss)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--void)" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>}
      </span>
      <span style={{ fontSize: 14, color: 'var(--ink)' }}>{label}</span>
    </button>
  );
}
function ChipMulti({ ids, onChange, options, emptyLabel }: { ids: string[]; onChange: (v: string[]) => void; options: { id: string; nameRusloc: string }[]; emptyLabel: string }) {
  const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  if (options.length === 0) return <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{emptyLabel}</div>;
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
      {options.map((o) => {
        const on = ids.includes(o.id);
        return (
          <button type="button" key={o.id} onClick={() => toggle(o.id)} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '6px 11px', background: on ? 'rgba(176,141,78,0.1)' : 'var(--abyss)', border: `1px solid ${on ? 'var(--brass)' : 'var(--rule)'}`, color: on ? 'var(--gold-pale)' : 'var(--ink-quiet)', fontSize: 13, cursor: 'pointer', transition: 'all 150ms' }}>
            {on ? <X size={11} /> : <Plus size={11} />}{o.nameRusloc}
          </button>
        );
      })}
    </div>
  );
}
function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className="ao-btn ao-btn--ghost ao-btn--sm" style={{ marginTop: 10 }}><Plus size={11} /> {children}</button>;
}
function RowShell({ onRemove, removeTitle, children }: { onRemove: () => void; removeTitle: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <GripVertical size={14} style={{ color: 'var(--ink-ghost)', flexShrink: 0 }} />
      <div style={{ display: 'flex', gap: 8, flex: 1, flexWrap: 'wrap', alignItems: 'center' }}>{children}</div>
      <button type="button" className="ao-iconbtn" title={removeTitle} onClick={onRemove} style={{ borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a', flexShrink: 0 }}><X size={13} /></button>
    </div>
  );
}
function Section({ index, title, sub, open, onToggle, children }: { index: string; title: string; sub?: string; open: boolean; onToggle: () => void; children: React.ReactNode }) {
  return (
    <div className="ao-panel" style={{ padding: 0, marginBottom: 12 }}>
      <button type="button" onClick={onToggle} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px', background: open ? 'linear-gradient(180deg, rgba(176,141,78,0.05), transparent)' : 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--gold-deep)', width: 24 }}>{index}</span>
        <Diamond size={8} color={open ? 'var(--gold)' : 'var(--bronze)'} />
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{title}</div>
          {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)', marginTop: 3 }}>{sub}</div>}
        </div>
        <ChevronDown size={18} style={{ color: 'var(--ink-quiet)', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 200ms' }} />
      </button>
      {open && <div style={{ padding: '4px 18px 22px', borderTop: '1px solid var(--rule)' }}>{children}</div>}
    </div>
  );
}
function Grid({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  return <div style={{ display: 'grid', gridTemplateColumns: `repeat(auto-fit, minmax(${min}px, 1fr))`, gap: 14, marginTop: 14 }}>{children}</div>;
}
function FieldBlock({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--ink-faint)', marginTop: 5 }}>{hint}</div>}
    </div>
  );
}
function SubHead({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: 'var(--font-display)', fontSize: 11, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--gold-pale)', margin: '18px 0 10px', display: 'flex', alignItems: 'center', gap: 8 }}><Diamond size={6} color="var(--bronze)" />{children}</div>;
}

const dictOpts = (list: DictionaryEntryResponse[]) => list.map((x) => ({ v: x.id, label: x.nameRusloc }));

export default function MonsterFormBody({ initial, dictionaries, skills, scope, contextLabel, submitting, onSubmit, onCancel }: Props) {
  const t = useT() as TFunc;
  const [m, setM] = useState<MonsterFormState>(initial);
  const [open, setOpen] = useState<Record<string, boolean>>({ basic: true, defense: false, abilities: false, refs: false, lists: false, features: false, lore: false });
  const set = <K extends keyof MonsterFormState>(k: K, v: MonsterFormState[K]) => setM((p) => ({ ...p, [k]: v }));
  const toggleSec = (k: string) => setOpen((p) => ({ ...p, [k]: !p[k] }));

  const addRow = <K extends keyof MonsterFormState>(key: K, row: object) => set(key, [...(m[key] as unknown[]), { _id: rowUid(), ...row }] as MonsterFormState[K]);
  const rmRow = <K extends keyof MonsterFormState>(key: K, id: number) => set(key, (m[key] as { _id: number }[]).filter((r) => r._id !== id) as MonsterFormState[K]);
  const setRow = <K extends keyof MonsterFormState>(key: K, id: number, patch: object) => set(key, (m[key] as { _id: number }[]).map((r) => (r._id === id ? { ...r, ...patch } : r)) as MonsterFormState[K]);

  const sizeOpts = sizeOptions(t);
  const abilityOpts = abilityOptions(t);
  const damageOpts = damageTypeOptions(t);
  const skillOpts = skills.map((sk) => ({ v: sk.id, label: sk.name }));
  const sectionOpts = SECTION_PRESETS.map((sct) => ({ v: sct, label: t(sectionKey(sct)) }));

  const submit = () => {
    if (!m.nameRusloc.trim()) { toast.error(t('best.form.errName')); setOpen((p) => ({ ...p, basic: true })); return; }
    if (!m.size) { toast.error(t('best.form.errSize')); setOpen((p) => ({ ...p, basic: true })); return; }
    if (!m.crRating.trim() || m.crValue.trim() === '') { toast.error(t('best.form.errCr')); setOpen((p) => ({ ...p, basic: true })); return; }
    if (m.armorClass.trim() === '') { toast.error(t('best.form.errAc')); setOpen((p) => ({ ...p, defense: true })); return; }
    onSubmit(buildMonsterRequest(m));
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--stone)' }}>
      <header style={{ position: 'sticky', top: 0, zIndex: 10, minHeight: 64, borderBottom: '1px solid var(--rule)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 14, padding: '12px clamp(16px, 3vw, 32px)', background: 'linear-gradient(180deg, var(--panel) 0%, var(--stone) 100%)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flex: '1 1 auto' }}>
          <Diamond size={9} />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, letterSpacing: 'var(--track-eng)', textTransform: 'uppercase', color: 'var(--ink-bright)' }}>{t('best.form.title')}</div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--ink-faint)' }}>{m.nameRusloc || t('best.form.newMonster')} · {contextLabel}</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="ao-btn ao-btn--ghost" onClick={onCancel}><Ban size={13} /> {t('best.com.cancel')}</button>
          <button type="button" className="ao-btn ao-btn--primary" onClick={submit} disabled={submitting}><Save size={13} /> {submitting ? t('best.com.saving') : t('best.com.save')}</button>
        </div>
      </header>

      <div style={{ maxWidth: 880, margin: '0 auto', padding: 'clamp(16px, 3vw, 28px)' }}>
        {/* 01 */}
        <Section index="01" title={t('best.form.s01')} sub={t('best.form.s01sub')} open={open.basic} onToggle={() => toggleSec('basic')}>
          <Grid>
            <FieldBlock label={t('best.form.nameRu')} required><Text value={m.nameRusloc} onChange={(v) => set('nameRusloc', v)} placeholder={t('best.form.namePh')} /></FieldBlock>
            <FieldBlock label={t('best.form.nameEn')}><Text value={m.nameEngloc} onChange={(v) => set('nameEngloc', v)} placeholder="Goblin" /></FieldBlock>
            <FieldBlock label={t('best.form.slug')} hint={t('best.form.slugHint')}><Text value={m.slug} onChange={(v) => set('slug', v)} placeholder="goblin" mono /></FieldBlock>
            <FieldBlock label={t('best.form.alignment')}><Sel value={m.alignmentId} onChange={(v) => set('alignmentId', v)} options={dictOpts(dictionaries.alignments)} placeholder={t('best.form.noneSelected')} /></FieldBlock>
            <FieldBlock label={t('best.form.size')} required><Sel value={m.size} onChange={(v) => set('size', v as MonsterFormState['size'])} options={sizeOpts} placeholder={t('best.form.pickSize')} /></FieldBlock>
            <FieldBlock label={t('best.form.sizeSecondary')}><Sel value={m.sizeSecondary} onChange={(v) => set('sizeSecondary', v)} options={sizeOpts} placeholder={t('best.form.none')} /></FieldBlock>
          </Grid>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: 18, marginTop: 14 }}>
            <Check on={m.isSwarm} onChange={() => set('isSwarm', !m.isSwarm)} label={t('best.form.isSwarm')} />
            {m.isSwarm && <div style={{ width: 200 }}><Label>{t('best.form.swarmSize')}</Label><Sel value={m.swarmSize} onChange={(v) => set('swarmSize', v)} options={sizeOpts} placeholder={t('best.form.pickSize')} /></div>}
          </div>
          <Grid min={150}>
            <FieldBlock label={t('best.form.crRating')} required><Text value={m.crRating} onChange={(v) => set('crRating', v)} placeholder="1/4" mono /></FieldBlock>
            <FieldBlock label={t('best.form.crValue')} required><Num value={m.crValue} onChange={(v) => set('crValue', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.xpBase')}><Num value={m.xpBase} onChange={(v) => set('xpBase', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.xpLair')}><Num value={m.xpLair} onChange={(v) => set('xpLair', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.profBonus')}><Num value={m.proficiencyBonus} onChange={(v) => set('proficiencyBonus', v)} /></FieldBlock>
          </Grid>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, marginTop: 18 }}>
            {scope === 'SYSTEM' && <Check on={m.isActive} onChange={() => set('isActive', !m.isActive)} label={t('best.form.isActive')} />}
            {scope === 'CAMPAIGN' && <Check on={m.isVisibleToPlayers} onChange={() => set('isVisibleToPlayers', !m.isVisibleToPlayers)} label={t('best.form.isVisible')} />}
          </div>
        </Section>

        {/* 02 */}
        <Section index="02" title={t('best.form.s02')} sub={t('best.form.s02sub')} open={open.defense} onToggle={() => toggleSec('defense')}>
          <Grid min={150}>
            <FieldBlock label={t('best.form.armorClass')} required><Num value={m.armorClass} onChange={(v) => set('armorClass', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.acText')}><Text value={m.armorClassText} onChange={(v) => set('armorClassText', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.initBonus')}><Num value={m.initiativeBonus} onChange={(v) => set('initiativeBonus', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.initScore')}><Num value={m.initiativeScore} onChange={(v) => set('initiativeScore', v)} /></FieldBlock>
          </Grid>
          <SubHead>{t('best.form.hp')}</SubHead>
          <Grid min={120}>
            <FieldBlock label={t('best.form.hpAverage')}><Num value={m.hpAverage} onChange={(v) => set('hpAverage', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.hpDiceCount')}><Num value={m.hpDiceCount} onChange={(v) => set('hpDiceCount', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.hpDiceSides')}><Num value={m.hpDiceSides} onChange={(v) => set('hpDiceSides', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.hpDiceMod')}><Num value={m.hpDiceModifier} onChange={(v) => set('hpDiceModifier', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.hpFormula')}><Text value={m.hpFormula} onChange={(v) => set('hpFormula', v)} placeholder="2d6" mono /></FieldBlock>
          </Grid>
        </Section>

        {/* 03 */}
        <Section index="03" title={t('best.form.s03')} sub={t('best.form.s03sub')} open={open.abilities} onToggle={() => toggleSec('abilities')}>
          <SubHead>{t('best.form.abilityScores')}</SubHead>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10 }} className="bd-abil">
            {ABILITY_SCORE_FIELDS.map((a) => (
              <div key={a.key} style={{ textAlign: 'center' }}>
                <Label required>{t(abilityShortKey(a.full))}</Label>
                <Num value={m[a.key]} onChange={(v) => set(a.key, v)} />
              </div>
            ))}
          </div>
          <Grid min={180}>
            <FieldBlock label={t('best.form.passivePerception')}><Num value={m.passivePerception} onChange={(v) => set('passivePerception', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.telepathy')}><Num value={m.telepathyFt} onChange={(v) => set('telepathyFt', v)} /></FieldBlock>
          </Grid>
        </Section>

        {/* 04 */}
        <Section index="04" title={t('best.form.s04')} sub={t('best.form.s04sub')} open={open.refs} onToggle={() => toggleSec('refs')}>
          <SubHead>{t('best.form.creatureTypes')}</SubHead><ChipMulti ids={m.creatureTypeIds} onChange={(v) => set('creatureTypeIds', v)} options={dictionaries['creature-types']} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.languages')}</SubHead><ChipMulti ids={m.languageIds} onChange={(v) => set('languageIds', v)} options={dictionaries.languages} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.condImmunities')}</SubHead><ChipMulti ids={m.conditionImmunityIds} onChange={(v) => set('conditionImmunityIds', v)} options={dictionaries.conditions} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.habitats')}</SubHead><ChipMulti ids={m.habitatIds} onChange={(v) => set('habitatIds', v)} options={dictionaries.habitats} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.treasureTags')}</SubHead><ChipMulti ids={m.treasureTagIds} onChange={(v) => set('treasureTagIds', v)} options={dictionaries['treasure-tags']} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.sources')}</SubHead><ChipMulti ids={m.sourceIds} onChange={(v) => set('sourceIds', v)} options={dictionaries.sources} emptyLabel={t('best.form.emptyDict')} />
        </Section>

        {/* 05 */}
        <Section index="05" title={t('best.form.s05')} sub={t('best.form.s05sub')} open={open.lists} onToggle={() => toggleSec('lists')}>
          <SubHead>{t('best.form.speeds')}</SubHead>
          {m.speeds.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('speeds', r._id)}>
              <div style={{ flex: '1 1 160px' }}><Sel value={r.movementTypeId} onChange={(v) => setRow('speeds', r._id, { movementTypeId: v })} options={dictOpts(dictionaries['movement-types'])} placeholder={t('best.form.pickType')} /></div>
              <Num value={r.ft} onChange={(v) => setRow('speeds', r._id, { ft: v })} w={80} />
              <Check on={r.hover} onChange={() => setRow('speeds', r._id, { hover: !r.hover })} label={t('best.form.hover')} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('speeds', { movementTypeId: '', ft: '30', hover: false })}>{t('best.form.addSpeed')}</AddBtn>

          <SubHead>{t('best.form.senses')}</SubHead>
          {m.senses.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('senses', r._id)}>
              <div style={{ flex: '1 1 160px' }}><Sel value={r.senseTypeId} onChange={(v) => setRow('senses', r._id, { senseTypeId: v })} options={dictOpts(dictionaries['sense-types'])} placeholder={t('best.form.pickType')} /></div>
              <Num value={r.ft} onChange={(v) => setRow('senses', r._id, { ft: v })} w={80} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('senses', { senseTypeId: '', ft: '60' })}>{t('best.form.addSense')}</AddBtn>

          <SubHead>{t('best.form.saves')}</SubHead>
          {m.savingThrows.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('savingThrows', r._id)}>
              <div style={{ flex: '1 1 160px' }}><Sel value={r.ability} onChange={(v) => setRow('savingThrows', r._id, { ability: v })} options={abilityOpts} /></div>
              <Num value={r.bonus} onChange={(v) => setRow('savingThrows', r._id, { bonus: v })} w={80} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('savingThrows', { ability: 'DEXTERITY', bonus: '0' })}>{t('best.form.addSave')}</AddBtn>

          <SubHead>{t('best.form.skills')}</SubHead>
          {m.skillProficiencies.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('skillProficiencies', r._id)}>
              <div style={{ flex: '1 1 160px' }}><Sel value={r.proficiencySkillId} onChange={(v) => setRow('skillProficiencies', r._id, { proficiencySkillId: v })} options={skillOpts} placeholder={t('best.form.pickSkill')} /></div>
              <Num value={r.bonus} onChange={(v) => setRow('skillProficiencies', r._id, { bonus: v })} w={80} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('skillProficiencies', { proficiencySkillId: '', bonus: '0' })}>{t('best.form.addSkill')}</AddBtn>

          {(['damageResistances', 'damageImmunities', 'damageVulnerabilities'] as const).map((key) => {
            const title = key === 'damageResistances' ? t('best.form.dmgResist') : key === 'damageImmunities' ? t('best.form.dmgImmun') : t('best.form.dmgVuln');
            return (
              <div key={key}>
                <SubHead>{title}</SubHead>
                {m[key].map((r) => (
                  <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow(key, r._id)}>
                    <div style={{ flex: '1 1 160px' }}><Sel value={r.damageType} onChange={(v) => setRow(key, r._id, { damageType: v })} options={damageOpts} placeholder={t('best.form.pickDmg')} /></div>
                    <div style={{ flex: '2 1 180px' }}><Text value={r.note} onChange={(v) => setRow(key, r._id, { note: v })} placeholder={t('best.form.notePh')} /></div>
                  </RowShell>
                ))}
                <AddBtn onClick={() => addRow(key, { damageType: '', note: '' })}>{t('best.form.addRow')}</AddBtn>
              </div>
            );
          })}

          <SubHead>{t('best.form.gear')}</SubHead>
          {m.gear.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('gear', r._id)}>
              <div style={{ flex: '1 1 160px' }}><Sel value={r.itemId} onChange={(v) => setRow('gear', r._id, { itemId: v })} options={dictOpts(dictionaries['gear-items'])} placeholder={t('best.form.pickItem')} /></div>
              <Num value={r.qty} onChange={(v) => setRow('gear', r._id, { qty: v })} w={70} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('gear', { itemId: '', qty: '1' })}>{t('best.form.addGear')}</AddBtn>
        </Section>

        {/* 06 */}
        <Section index="06" title={t('best.form.s06')} sub={t('best.form.s06sub')} open={open.features} onToggle={() => toggleSec('features')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 10 }}>
            {m.features.map((f) => {
              const patchFeature = (patch: Partial<FeatureFormRow>) => setRow('features', f._id, patch);
              const setDamages = (damages: FeatureDamageFormRow[]) => patchFeature({ damages });
              return (
                <div key={f._id} className="ao-panel--inset" style={{ padding: 16, position: 'relative' }}>
                  <button type="button" className="ao-iconbtn" title={t('best.form.removeFeature')} onClick={() => rmRow('features', f._id)} style={{ position: 'absolute', top: 12, right: 12, borderColor: 'rgba(179,70,26,0.4)', color: '#d8896a' }}><X size={13} /></button>
                  <Grid min={150}>
                    <FieldBlock label={t('best.form.fSection')}><Sel value={f.section} onChange={(v) => patchFeature({ section: v })} options={sectionOpts} /></FieldBlock>
                    <FieldBlock label={t('best.form.fSort')}><Num value={f.sortOrder} onChange={(v) => patchFeature({ sortOrder: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fKind')}><Text value={f.kind} onChange={(v) => patchFeature({ kind: v })} placeholder="melee_weapon" mono /></FieldBlock>
                  </Grid>
                  <Grid min={200}>
                    <FieldBlock label={t('best.form.fNameRu')}><Text value={f.nameRusloc} onChange={(v) => patchFeature({ nameRusloc: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fNameEn')}><Text value={f.nameEngloc} onChange={(v) => patchFeature({ nameEngloc: v })} /></FieldBlock>
                  </Grid>
                  <Grid min={120}>
                    <FieldBlock label={t('best.form.fRechargeMin')}><Num value={f.rechargeMin} onChange={(v) => patchFeature({ rechargeMin: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fRechargeMax')}><Num value={f.rechargeMax} onChange={(v) => patchFeature({ rechargeMax: v })} /></FieldBlock>
                  </Grid>
                  <div style={{ marginTop: 14 }}><Label>{t('best.form.fDescRu')}</Label><textarea className="ao-input" rows={2} value={f.descriptionRusloc} onChange={(e) => patchFeature({ descriptionRusloc: e.target.value })} style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }} /></div>
                  <div style={{ marginTop: 12 }}><Label>{t('best.form.fDescEn')}</Label><textarea className="ao-input" rows={2} value={f.descriptionEngloc} onChange={(e) => patchFeature({ descriptionEngloc: e.target.value })} style={{ resize: 'vertical', fontFamily: 'var(--font-sans)' }} /></div>

                  <SubHead>{t('best.form.attack')}</SubHead>
                  <Grid min={120}>
                    <FieldBlock label={t('best.form.fAttackType')}><Text value={f.attackType} onChange={(v) => patchFeature({ attackType: v })} placeholder="melee / ranged" mono /></FieldBlock>
                    <FieldBlock label={t('best.form.fAttackBonus')}><Num value={f.attackBonus} onChange={(v) => patchFeature({ attackBonus: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fReach')}><Num value={f.reachFt} onChange={(v) => patchFeature({ reachFt: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fRange')}><Num value={f.rangeFt} onChange={(v) => patchFeature({ rangeFt: v })} /></FieldBlock>
                    <FieldBlock label={t('best.form.fRangeLong')}><Num value={f.rangeLongFt} onChange={(v) => patchFeature({ rangeLongFt: v })} /></FieldBlock>
                  </Grid>
                  <SubHead>{t('best.form.save2')}</SubHead>
                  <Grid min={150}>
                    <FieldBlock label={t('best.form.fSaveAbility')}><Sel value={f.saveAbility} onChange={(v) => patchFeature({ saveAbility: v })} options={abilityOpts} placeholder={t('best.form.none')} /></FieldBlock>
                    <FieldBlock label={t('best.form.fSaveDc')}><Num value={f.saveDc} onChange={(v) => patchFeature({ saveDc: v })} /></FieldBlock>
                  </Grid>

                  <SubHead>{t('best.form.damage')}</SubHead>
                  {f.damages.map((d) => (
                    <RowShell key={d._id} removeTitle={t('best.form.removeRow')} onRemove={() => setDamages(f.damages.filter((x) => x._id !== d._id))}>
                      <Num value={d.sortOrder} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, sortOrder: v } : x))} w={56} />
                      <Num value={d.average} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, average: v } : x))} w={64} />
                      <div style={{ flex: '1 1 90px' }}><Text value={d.dice} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, dice: v } : x))} placeholder="1d6+2" mono /></div>
                      <div style={{ flex: '1 1 130px' }}><Sel value={d.damageType} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, damageType: v } : x))} options={damageOpts} placeholder={t('best.form.pickType')} /></div>
                      <div style={{ flex: '1 1 120px' }}><Text value={d.note} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, note: v } : x))} placeholder={t('best.form.shortNotePh')} /></div>
                    </RowShell>
                  ))}
                  <AddBtn onClick={() => setDamages([...f.damages, { _id: rowUid(), sortOrder: String(f.damages.length), average: '', dice: '', damageType: '', note: '' }])}>{t('best.form.addDamage')}</AddBtn>
                </div>
              );
            })}
          </div>
          <AddBtn onClick={() => addRow('features', { section: 'actions', sortOrder: String(m.features.length), nameRusloc: '', nameEngloc: '', kind: '', rechargeMin: '', rechargeMax: '', descriptionRusloc: '', descriptionEngloc: '', attackType: '', attackBonus: '', reachFt: '', rangeFt: '', rangeLongFt: '', saveAbility: '', saveDc: '', damages: [] })}>{t('best.form.addFeature')}</AddBtn>
        </Section>

        {/* 07 */}
        <Section index="07" title={t('best.form.s07')} sub={t('best.form.s07sub')} open={open.lore} onToggle={() => toggleSec('lore')}>
          <div style={{ marginTop: 14 }}><Label>{t('best.form.lore')}</Label><textarea className="ao-input" rows={4} value={m.loreText} onChange={(e) => set('loreText', e.target.value)} style={{ resize: 'vertical', fontFamily: 'var(--font-serif)', fontSize: 16 }} /></div>
          <div style={{ marginTop: 14 }}><Label>{t('best.form.legendaryText')}</Label><textarea className="ao-input" rows={3} value={m.legendaryText} onChange={(e) => set('legendaryText', e.target.value)} style={{ resize: 'vertical', fontFamily: 'var(--font-serif)', fontSize: 16 }} /></div>
          <Grid min={180}>
            <FieldBlock label={t('best.form.legendaryBase')}><Num value={m.legendaryUsesBase} onChange={(v) => set('legendaryUsesBase', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.legendaryLair')}><Num value={m.legendaryUsesLair} onChange={(v) => set('legendaryUsesLair', v)} /></FieldBlock>
          </Grid>
        </Section>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18, paddingBottom: 20 }}>
          <button type="button" className="ao-btn ao-btn--ghost ao-btn--lg" onClick={onCancel}><Ban size={14} /> {t('best.com.cancel')}</button>
          <button type="button" className="ao-btn ao-btn--primary ao-btn--lg" onClick={submit} disabled={submitting}><Save size={14} /> {submitting ? t('best.com.saving') : t('best.form.save')}</button>
        </div>
      </div>

      <style>{`@media (max-width: 560px) { .bd-abil { grid-template-columns: repeat(3, 1fr) !important; } }`}</style>
    </div>
  );
}
