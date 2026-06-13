import React, { useState, type CSSProperties } from 'react';
import { Plus, X, Save, Ban, GripVertical, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { DictionaryEntryResponse, DictionaryKind, MonsterRequest, MonsterScope } from '@/types';
import {
  ABILITY_SCORE_FIELDS,
  SECTION_PRESETS,
  abilityShortKey,
  sectionKey,
  type TFunc,
} from './constants';
import {
  buildMonsterRequest,
  rowUid,
  type FeatureDamageFormRow,
  type FeatureFormRow,
  type MonsterFormState,
} from './serialize';
import s from './MonsterFormBody.module.css';

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
  return <span className={s.diamond} style={{ '--d-size': `${size}px`, '--d-color': color } as CSSProperties} />;
}
function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return <label className={cn('ao-label', s.label)}>{children}{required && <span className={s.req}> *</span>}</label>;
}
function Text({ value, onChange, placeholder, mono }: { value: string; onChange: (v: string) => void; placeholder?: string; mono?: boolean }) {
  return <input className={cn('ao-input', mono && s.mono)} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />;
}
function Num({ value, onChange, w }: { value: string; onChange: (v: string) => void; w?: number }) {
  return <input className={cn('ao-input', s.num)} type="number" value={value ?? ''} onChange={(e) => onChange(e.target.value)} style={w != null ? ({ '--w': `${w}px` } as CSSProperties) : undefined} />;
}
function Sel({ value, onChange, options, placeholder }: { value: string; onChange: (v: string) => void; options: { v: string; label: string }[]; placeholder?: string }) {
  return (
    <select className={cn('ao-input', s.sel)} value={value ?? ''} onChange={(e) => onChange(e.target.value)}>
      {placeholder && <option value="" className={s.opt}>{placeholder}</option>}
      {options.map((o) => <option key={o.v} value={o.v} className={s.opt}>{o.label}</option>)}
    </select>
  );
}
function Check({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className={s.check}>
      <span className={cn(s.box, on && s.on)}>
        {on && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="var(--void)" strokeWidth="3"><path d="M4 12l5 5L20 6" /></svg>}
      </span>
      <span className={s.checkLabel}>{label}</span>
    </button>
  );
}
function ChipMulti({ ids, onChange, options, emptyLabel }: { ids: string[]; onChange: (v: string[]) => void; options: { id: string; nameRusloc: string }[]; emptyLabel: string }) {
  const toggle = (id: string) => onChange(ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id]);
  if (options.length === 0) return <div className={s.empty}>{emptyLabel}</div>;
  return (
    <div className={s.chips}>
      {options.map((o) => {
        const on = ids.includes(o.id);
        return (
          <button type="button" key={o.id} onClick={() => toggle(o.id)} className={cn(s.chip, on && s.on)}>
            {on ? <X size={11} /> : <Plus size={11} />}{o.nameRusloc}
          </button>
        );
      })}
    </div>
  );
}
function AddBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return <button type="button" onClick={onClick} className={cn('ao-btn ao-btn--ghost ao-btn--sm', s.addBtn)}><Plus size={11} /> {children}</button>;
}
function RowShell({ onRemove, removeTitle, children }: { onRemove: () => void; removeTitle: string; children: React.ReactNode }) {
  return (
    <div className={s.rowShell}>
      <GripVertical size={14} className={s.grip} />
      <div className={s.rowFields}>{children}</div>
      <button type="button" className={cn('ao-iconbtn', s.rmBtn)} title={removeTitle} onClick={onRemove}><X size={13} /></button>
    </div>
  );
}
function Grid({ children, min = 200 }: { children: React.ReactNode; min?: number }) {
  return <div className={s.grid} style={{ '--min': `${min}px` } as CSSProperties}>{children}</div>;
}
function FieldBlock({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      {children}
      {hint && <div className={s.hint}>{hint}</div>}
    </div>
  );
}
function SubHead({ children }: { children: React.ReactNode }) {
  return <div className={s.subHead}><Diamond size={6} color="var(--bronze)" />{children}</div>;
}

const dictOpts = (list: DictionaryEntryResponse[]) => list.map((x) => ({ v: x.id, label: x.nameRusloc }));

type StepKey = 'basic' | 'defense' | 'abilities' | 'refs' | 'lists' | 'features' | 'lore';
const STEPS: { key: StepKey; index: string; titleKey: string; subKey: string }[] = [
  { key: 'basic', index: '01', titleKey: 'best.form.s01', subKey: 'best.form.s01sub' },
  { key: 'defense', index: '02', titleKey: 'best.form.s02', subKey: 'best.form.s02sub' },
  { key: 'abilities', index: '03', titleKey: 'best.form.s03', subKey: 'best.form.s03sub' },
  { key: 'refs', index: '04', titleKey: 'best.form.s04', subKey: 'best.form.s04sub' },
  { key: 'lists', index: '05', titleKey: 'best.form.s05', subKey: 'best.form.s05sub' },
  { key: 'features', index: '06', titleKey: 'best.form.s06', subKey: 'best.form.s06sub' },
  { key: 'lore', index: '07', titleKey: 'best.form.s07', subKey: 'best.form.s07sub' },
];

function StepPanel({ index, title, sub, children }: { index: string; title: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className={cn('ao-panel', s.stepPanel)}>
      <div className={s.stepHead}>
        <span className={s.stepIndex}>{index}</span>
        <Diamond size={8} color="var(--gold)" />
        <div className="ao-grow">
          <div className={s.stepTitle}>{title}</div>
          {sub && <div className={s.stepSub}>{sub}</div>}
        </div>
      </div>
      <div className={s.stepBody}>{children}</div>
    </div>
  );
}

export default function MonsterFormBody({ initial, dictionaries, skills, scope, contextLabel, submitting, onSubmit, onCancel }: Props) {
  const t = useT() as TFunc;
  const [m, setM] = useState<MonsterFormState>(initial);
  const [step, setStep] = useState<StepKey>('basic');
  const set = <K extends keyof MonsterFormState>(k: K, v: MonsterFormState[K]) => setM((p) => ({ ...p, [k]: v }));

  const addRow = <K extends keyof MonsterFormState>(key: K, row: object) => set(key, [...(m[key] as unknown[]), { _id: rowUid(), ...row }] as MonsterFormState[K]);
  const rmRow = <K extends keyof MonsterFormState>(key: K, id: number) => set(key, (m[key] as { _id: number }[]).filter((r) => r._id !== id) as MonsterFormState[K]);
  const setRow = <K extends keyof MonsterFormState>(key: K, id: number, patch: object) => set(key, (m[key] as { _id: number }[]).map((r) => (r._id === id ? { ...r, ...patch } : r)) as MonsterFormState[K]);

  const sizeOpts = dictOpts(dictionaries.sizes);
  const abilityOpts = dictOpts(dictionaries.abilities);
  const damageOpts = dictOpts(dictionaries['damage-types']);
  const skillOpts = skills.map((sk) => ({ v: sk.id, label: sk.name }));
  const sectionOpts = SECTION_PRESETS.map((sct) => ({ v: sct, label: t(sectionKey(sct)) }));

  const stepErrors: Record<StepKey, boolean> = {
    basic: !m.nameRusloc.trim() || !m.sizeId || !m.crRating.trim() || m.crValue.trim() === '',
    defense: m.armorClass.trim() === '',
    abilities: false,
    refs: false,
    lists: false,
    features: false,
    lore: false,
  };

  const submit = () => {
    if (!m.nameRusloc.trim()) { toast.error(t('best.form.errName')); setStep('basic'); return; }
    if (!m.sizeId) { toast.error(t('best.form.errSize')); setStep('basic'); return; }
    if (!m.crRating.trim() || m.crValue.trim() === '') { toast.error(t('best.form.errCr')); setStep('basic'); return; }
    if (m.armorClass.trim() === '') { toast.error(t('best.form.errAc')); setStep('defense'); return; }
    onSubmit(buildMonsterRequest(m));
  };

  const stepIndex = STEPS.findIndex((st) => st.key === step);
  const goPrev = () => { if (stepIndex > 0) setStep(STEPS[stepIndex - 1].key); };
  const goNext = () => { if (stepIndex < STEPS.length - 1) setStep(STEPS[stepIndex + 1].key); };

  return (
    <div className={s.page}>
      <header className={s.header}>
        <div className={s.headTitle}>
          <Diamond size={9} />
          <div>
            <div className={s.appTitle}>{t('best.form.title')}</div>
            <div className={s.appSub}>{m.nameRusloc || t('best.form.newMonster')} · {contextLabel}</div>
          </div>
        </div>
        <div className="ao-row ao-gap-8">
          <button type="button" className="ao-btn ao-btn--ghost" onClick={onCancel}><Ban size={13} /> {t('best.com.cancel')}</button>
          <button type="button" className="ao-btn ao-btn--primary" onClick={submit} disabled={submitting}><Save size={13} /> {submitting ? t('best.com.saving') : t('best.com.save')}</button>
        </div>
      </header>

      <div className={cn('bd-wizard', s.wizard)}>
        {/* Left rail */}
        <nav className={cn('ao-panel', 'bd-rail', s.rail)}>
          {STEPS.map((st) => {
            const active = st.key === step;
            const err = stepErrors[st.key];
            return (
              <button
                key={st.key}
                type="button"
                onClick={() => setStep(st.key)}
                className={cn(s.railBtn, active && s.active)}
              >
                <span className={s.railIndex}>{st.index}</span>
                <span className={cn(s.railDot, err && s.err)} />
                <span className={s.railLabel}>{t(st.titleKey)}</span>
              </button>
            );
          })}
        </nav>

        {/* Main */}
        <div className={s.main}>
        {step === 'basic' && (
        <StepPanel index="01" title={t('best.form.s01')} sub={t('best.form.s01sub')}>
          <Grid>
            <FieldBlock label={t('best.form.nameRu')} required><Text value={m.nameRusloc} onChange={(v) => set('nameRusloc', v)} placeholder={t('best.form.namePh')} /></FieldBlock>
            <FieldBlock label={t('best.form.nameEn')}><Text value={m.nameEngloc} onChange={(v) => set('nameEngloc', v)} placeholder="Goblin" /></FieldBlock>
            <FieldBlock label={t('best.form.slug')} hint={t('best.form.slugHint')}><Text value={m.slug} onChange={(v) => set('slug', v)} placeholder="goblin" mono /></FieldBlock>
            <FieldBlock label={t('best.form.alignment')}><Sel value={m.alignmentId} onChange={(v) => set('alignmentId', v)} options={dictOpts(dictionaries.alignments)} placeholder={t('best.form.noneSelected')} /></FieldBlock>
            <FieldBlock label={t('best.form.size')} required><Sel value={m.sizeId} onChange={(v) => set('sizeId', v)} options={sizeOpts} placeholder={t('best.form.pickSize')} /></FieldBlock>
            <FieldBlock label={t('best.form.sizeSecondary')}><Sel value={m.sizeSecondaryId} onChange={(v) => set('sizeSecondaryId', v)} options={sizeOpts} placeholder={t('best.form.none')} /></FieldBlock>
          </Grid>
          <div className={s.rowEnd}>
            <Check on={m.isSwarm} onChange={() => set('isSwarm', !m.isSwarm)} label={t('best.form.isSwarm')} />
            {m.isSwarm && <div className={s.w200}><Label>{t('best.form.swarmSize')}</Label><Sel value={m.swarmSizeId} onChange={(v) => set('swarmSizeId', v)} options={sizeOpts} placeholder={t('best.form.pickSize')} /></div>}
          </div>
          <Grid min={150}>
            <FieldBlock label={t('best.form.crRating')} required><Text value={m.crRating} onChange={(v) => set('crRating', v)} placeholder="1/4" mono /></FieldBlock>
            <FieldBlock label={t('best.form.crValue')} required><Num value={m.crValue} onChange={(v) => set('crValue', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.xpBase')}><Num value={m.xpBase} onChange={(v) => set('xpBase', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.xpLair')}><Num value={m.xpLair} onChange={(v) => set('xpLair', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.profBonus')}><Num value={m.proficiencyBonus} onChange={(v) => set('proficiencyBonus', v)} /></FieldBlock>
          </Grid>
          <div className={s.rowChecks}>
            {scope === 'SYSTEM' && <Check on={m.isActive} onChange={() => set('isActive', !m.isActive)} label={t('best.form.isActive')} />}
            {scope === 'CAMPAIGN' && <Check on={m.isVisibleToPlayers} onChange={() => set('isVisibleToPlayers', !m.isVisibleToPlayers)} label={t('best.form.isVisible')} />}
          </div>
        </StepPanel>
        )}
        {step === 'defense' && (
        <StepPanel index="02" title={t('best.form.s02')} sub={t('best.form.s02sub')}>
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
        </StepPanel>
        )}
        {step === 'abilities' && (
        <StepPanel index="03" title={t('best.form.s03')} sub={t('best.form.s03sub')}>
          <SubHead>{t('best.form.abilityScores')}</SubHead>
          <div className={cn(s.abil, 'bd-abil')}>
            {ABILITY_SCORE_FIELDS.map((a) => (
              <div key={a.key} className={s.center}>
                <Label required>{t(abilityShortKey(a.full))}</Label>
                <Num value={m[a.key]} onChange={(v) => set(a.key, v)} />
              </div>
            ))}
          </div>
          <Grid min={180}>
            <FieldBlock label={t('best.form.passivePerception')}><Num value={m.passivePerception} onChange={(v) => set('passivePerception', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.telepathy')}><Num value={m.telepathyFt} onChange={(v) => set('telepathyFt', v)} /></FieldBlock>
          </Grid>
        </StepPanel>
        )}
        {step === 'refs' && (
        <StepPanel index="04" title={t('best.form.s04')} sub={t('best.form.s04sub')}>
          <SubHead>{t('best.form.creatureTypes')}</SubHead><ChipMulti ids={m.creatureTypeIds} onChange={(v) => set('creatureTypeIds', v)} options={dictionaries['creature-types']} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.languages')}</SubHead><ChipMulti ids={m.languageIds} onChange={(v) => set('languageIds', v)} options={dictionaries.languages} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.condImmunities')}</SubHead><ChipMulti ids={m.conditionImmunityIds} onChange={(v) => set('conditionImmunityIds', v)} options={dictionaries.conditions} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.habitats')}</SubHead><ChipMulti ids={m.habitatIds} onChange={(v) => set('habitatIds', v)} options={dictionaries.habitats} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.treasureTags')}</SubHead><ChipMulti ids={m.treasureTagIds} onChange={(v) => set('treasureTagIds', v)} options={dictionaries['treasure-tags']} emptyLabel={t('best.form.emptyDict')} />
          <SubHead>{t('best.form.sources')}</SubHead><ChipMulti ids={m.sourceIds} onChange={(v) => set('sourceIds', v)} options={dictionaries.sources} emptyLabel={t('best.form.emptyDict')} />
        </StepPanel>
        )}
        {step === 'lists' && (
        <StepPanel index="05" title={t('best.form.s05')} sub={t('best.form.s05sub')}>
          <SubHead>{t('best.form.speeds')}</SubHead>
          {m.speeds.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('speeds', r._id)}>
              <div className={s.f160}><Sel value={r.movementTypeId} onChange={(v) => setRow('speeds', r._id, { movementTypeId: v })} options={dictOpts(dictionaries['movement-types'])} placeholder={t('best.form.pickType')} /></div>
              <Num value={r.ft} onChange={(v) => setRow('speeds', r._id, { ft: v })} w={80} />
              <Check on={r.hover} onChange={() => setRow('speeds', r._id, { hover: !r.hover })} label={t('best.form.hover')} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('speeds', { movementTypeId: '', ft: '30', hover: false })}>{t('best.form.addSpeed')}</AddBtn>

          <SubHead>{t('best.form.senses')}</SubHead>
          {m.senses.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('senses', r._id)}>
              <div className={s.f160}><Sel value={r.senseTypeId} onChange={(v) => setRow('senses', r._id, { senseTypeId: v })} options={dictOpts(dictionaries['sense-types'])} placeholder={t('best.form.pickType')} /></div>
              <Num value={r.ft} onChange={(v) => setRow('senses', r._id, { ft: v })} w={80} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('senses', { senseTypeId: '', ft: '60' })}>{t('best.form.addSense')}</AddBtn>

          <SubHead>{t('best.form.saves')}</SubHead>
          {m.savingThrows.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('savingThrows', r._id)}>
              <div className={s.f160}><Sel value={r.abilityId} onChange={(v) => setRow('savingThrows', r._id, { abilityId: v })} options={abilityOpts} placeholder={t('best.form.pickType')} /></div>
              <Num value={r.bonus} onChange={(v) => setRow('savingThrows', r._id, { bonus: v })} w={80} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('savingThrows', { abilityId: '', bonus: '0' })}>{t('best.form.addSave')}</AddBtn>

          <SubHead>{t('best.form.skills')}</SubHead>
          {m.skillProficiencies.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('skillProficiencies', r._id)}>
              <div className={s.f160}><Sel value={r.proficiencySkillId} onChange={(v) => setRow('skillProficiencies', r._id, { proficiencySkillId: v })} options={skillOpts} placeholder={t('best.form.pickSkill')} /></div>
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
                    <div className={s.f160}><Sel value={r.damageTypeId} onChange={(v) => setRow(key, r._id, { damageTypeId: v })} options={damageOpts} placeholder={t('best.form.pickDmg')} /></div>
                    <div className={s.f180x2}><Text value={r.note} onChange={(v) => setRow(key, r._id, { note: v })} placeholder={t('best.form.notePh')} /></div>
                  </RowShell>
                ))}
                <AddBtn onClick={() => addRow(key, { damageTypeId: '', note: '' })}>{t('best.form.addRow')}</AddBtn>
              </div>
            );
          })}

          <SubHead>{t('best.form.gear')}</SubHead>
          {m.gear.map((r) => (
            <RowShell key={r._id} removeTitle={t('best.form.removeRow')} onRemove={() => rmRow('gear', r._id)}>
              <div className={s.f160}><Sel value={r.itemId} onChange={(v) => setRow('gear', r._id, { itemId: v })} options={dictOpts(dictionaries['gear-items'])} placeholder={t('best.form.pickItem')} /></div>
              <Num value={r.qty} onChange={(v) => setRow('gear', r._id, { qty: v })} w={70} />
            </RowShell>
          ))}
          <AddBtn onClick={() => addRow('gear', { itemId: '', qty: '1' })}>{t('best.form.addGear')}</AddBtn>
        </StepPanel>
        )}
        {step === 'features' && (
        <StepPanel index="06" title={t('best.form.s06')} sub={t('best.form.s06sub')}>
          <div className={s.featCol}>
            {m.features.map((f) => {
              const patchFeature = (patch: Partial<FeatureFormRow>) => setRow('features', f._id, patch);
              const setDamages = (damages: FeatureDamageFormRow[]) => patchFeature({ damages });
              return (
                <div key={f._id} className={cn('ao-panel--inset', s.featPanel)}>
                  <button type="button" className={cn('ao-iconbtn', s.featRm)} title={t('best.form.removeFeature')} onClick={() => rmRow('features', f._id)}><X size={13} /></button>
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
                  <div className={s.mt14}><Label>{t('best.form.fDescRu')}</Label><textarea className={cn('ao-input', s.taVert)} rows={2} value={f.descriptionRusloc} onChange={(e) => patchFeature({ descriptionRusloc: e.target.value })} /></div>
                  <div className={s.mt12}><Label>{t('best.form.fDescEn')}</Label><textarea className={cn('ao-input', s.taVert)} rows={2} value={f.descriptionEngloc} onChange={(e) => patchFeature({ descriptionEngloc: e.target.value })} /></div>

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
                    <FieldBlock label={t('best.form.fSaveAbility')}><Sel value={f.saveAbilityId} onChange={(v) => patchFeature({ saveAbilityId: v })} options={abilityOpts} placeholder={t('best.form.none')} /></FieldBlock>
                    <FieldBlock label={t('best.form.fSaveDc')}><Num value={f.saveDc} onChange={(v) => patchFeature({ saveDc: v })} /></FieldBlock>
                  </Grid>

                  <SubHead>{t('best.form.damage')}</SubHead>
                  {f.damages.map((d) => (
                    <RowShell key={d._id} removeTitle={t('best.form.removeRow')} onRemove={() => setDamages(f.damages.filter((x) => x._id !== d._id))}>
                      <Num value={d.sortOrder} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, sortOrder: v } : x))} w={56} />
                      <Num value={d.average} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, average: v } : x))} w={64} />
                      <div className={s.f90}><Text value={d.dice} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, dice: v } : x))} placeholder="1d6+2" mono /></div>
                      <div className={s.f130}><Sel value={d.damageTypeId} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, damageTypeId: v } : x))} options={damageOpts} placeholder={t('best.form.pickType')} /></div>
                      <div className={s.f120}><Text value={d.note} onChange={(v) => setDamages(f.damages.map((x) => x._id === d._id ? { ...x, note: v } : x))} placeholder={t('best.form.shortNotePh')} /></div>
                    </RowShell>
                  ))}
                  <AddBtn onClick={() => setDamages([...f.damages, { _id: rowUid(), sortOrder: String(f.damages.length), average: '', dice: '', damageTypeId: '', note: '' }])}>{t('best.form.addDamage')}</AddBtn>
                </div>
              );
            })}
          </div>
          <AddBtn onClick={() => addRow('features', { section: 'actions', sortOrder: String(m.features.length), nameRusloc: '', nameEngloc: '', kind: '', rechargeMin: '', rechargeMax: '', descriptionRusloc: '', descriptionEngloc: '', attackType: '', attackBonus: '', reachFt: '', rangeFt: '', rangeLongFt: '', saveAbilityId: '', saveDc: '', damages: [] })}>{t('best.form.addFeature')}</AddBtn>
        </StepPanel>
        )}
        {step === 'lore' && (
        <StepPanel index="07" title={t('best.form.s07')} sub={t('best.form.s07sub')}>
          <div className={s.mt14}><Label>{t('best.form.lore')}</Label><textarea className={cn('ao-input', s.taLore)} rows={4} value={m.loreText} onChange={(e) => set('loreText', e.target.value)} /></div>
          <div className={s.mt14}><Label>{t('best.form.legendaryText')}</Label><textarea className={cn('ao-input', s.taLore)} rows={3} value={m.legendaryText} onChange={(e) => set('legendaryText', e.target.value)} /></div>
          <Grid min={180}>
            <FieldBlock label={t('best.form.legendaryBase')}><Num value={m.legendaryUsesBase} onChange={(v) => set('legendaryUsesBase', v)} /></FieldBlock>
            <FieldBlock label={t('best.form.legendaryLair')}><Num value={m.legendaryUsesLair} onChange={(v) => set('legendaryUsesLair', v)} /></FieldBlock>
          </Grid>
        </StepPanel>
        )}

        <div className={s.footNav}>
          <button type="button" className="ao-btn ao-btn--ghost" onClick={goPrev} disabled={stepIndex === 0}><ChevronLeft size={14} /> {t('best.form.prevStep')}</button>
          <span className={s.stepCount}>{t('best.form.stepOf', { n: stepIndex + 1, total: STEPS.length })}</span>
          <div className="ao-grow" />
          {stepIndex < STEPS.length - 1
            ? <button type="button" className="ao-btn ao-btn--primary" onClick={goNext}>{t('best.form.nextStep')} <ChevronRight size={14} /></button>
            : <button type="button" className="ao-btn ao-btn--primary ao-btn--lg" onClick={submit} disabled={submitting}><Save size={14} /> {submitting ? t('best.com.saving') : t('best.form.save')}</button>}
        </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 560px) { .bd-abil { grid-template-columns: repeat(3, 1fr) !important; } }
        @media (max-width: 820px) {
          .bd-wizard { grid-template-columns: 1fr !important; }
          .bd-rail { position: static !important; flex-direction: row !important; flex-wrap: wrap; }
        }
      `}</style>
    </div>
  );
}
