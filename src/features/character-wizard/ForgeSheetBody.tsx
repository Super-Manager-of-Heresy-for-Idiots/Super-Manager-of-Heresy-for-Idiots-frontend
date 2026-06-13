// ============================================================
// Forge sheet body — the full, editable D&D 5e character sheet
// used as the Wizard's final "Summary" step (ported from the
// reference Character Forge design). Driven by { c, onChange }.
// ============================================================
import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { useGameTerms } from '@/i18n/gameTerms';
import { cn } from '@/lib/utils';
import css from './ForgeSheetBody.module.css';
import {
  ABILITIES,
  SKILLS,
  abilityMod,
  fmtMod,
  profByLevel,
  clamp,
  type AbilityDef,
  type AbilityKey,
} from '@/data/wizard5e';
import type { CoinKey, WizardChar } from './wizardState';

const COIN: { key: CoinKey; label: string }[] = [
  { key: 'pp', label: 'PP' },
  { key: 'gp', label: 'GP' },
  { key: 'ep', label: 'EP' },
  { key: 'sp', label: 'SP' },
  { key: 'cp', label: 'CP' },
];

const onlyDigits = (v: string) => v.replace(/[^0-9]/g, '');
const digitsAllowMinus = (v: string) => v.replace(/[^0-9-]/g, '');

interface ForgeSheetBodyProps {
  c: WizardChar;
  onChange: (next: WizardChar) => void;
}

export function ForgeSheetBody({ c, onChange }: ForgeSheetBodyProps) {
  const t = useT();
  const prof = profByLevel(c.level);
  const mods = {} as Record<AbilityKey, number>;
  ABILITIES.forEach((a) => { mods[a.key] = abilityMod(c.scores[a.key]); });
  const initiative = mods.dex;
  const perceptionBonus = mods.wis + (c.skills.perception ? prof : 0);
  const passivePerception = 10 + perceptionBonus;
  const hpPct = c.hp.max > 0 ? clamp((c.hp.cur / c.hp.max) * 100, 0, 100) : 0;

  const set = (patch: Partial<WizardChar>) => onChange({ ...c, ...patch });
  const setScore = (k: AbilityKey, v: number) => onChange({ ...c, scores: { ...c.scores, [k]: v } });
  const setHp = (k: 'max' | 'cur' | 'temp', v: number) => onChange({ ...c, hp: { ...c.hp, [k]: v } });
  const setCoin = (k: CoinKey, v: string) => onChange({ ...c, coins: { ...c.coins, [k]: v } });
  const toggleSave = (k: AbilityKey) => onChange({ ...c, saves: { ...c.saves, [k]: !c.saves[k] } });
  const toggleSkill = (k: string) => onChange({ ...c, skills: { ...c.skills, [k]: !c.skills[k] } });
  const setAttack = (i: number, patch: Partial<WizardChar['attacks'][number]>) =>
    onChange({ ...c, attacks: c.attacks.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  const addAttack = () => onChange({ ...c, attacks: [...c.attacks, { name: '', hit: '', dmg: '', type: '' }] });
  const delAttack = (i: number) => onChange({ ...c, attacks: c.attacks.filter((_, j) => j !== i) });
  const setDeath = (kind: 'succ' | 'fail', n: number) => {
    const cur = kind === 'succ' ? c.deathSucc : c.deathFail;
    const next = cur === n ? n - 1 : n;
    set({ [kind === 'succ' ? 'deathSucc' : 'deathFail']: clamp(next, 0, 3) } as Partial<WizardChar>);
  };

  return (
    <div className="forge-page">
      {/* ── HEADER BAND ─────────────────────────────────── */}
      <OrdoPanel frame padding={0}>
        <div className="forge-header">
          <div className="forge-header-name">
            {c.avatar && (
              <div className="forge-avatar-frame">
                <img src={c.avatar} alt={t('wiz.forge.portraitAlt')} />
              </div>
            )}
            <div className={css.nameWrap}>
              <label className="ao-label">{t('wiz.forge.characterName')}</label>
              <input
                className={cn('ao-input', css.nameInput)}
                value={c.name}
                placeholder={t('wiz.forge.nameSoul')}
                onChange={(e) => set({ name: e.target.value })}
              />
            </div>
          </div>
          <div className="forge-header-meta">
            <ClassLevelField c={c} set={set} />
            <FForgeField label={t('wiz.forge.background')} value={c.background} onChange={(v) => set({ background: v })} placeholder={t('wiz.forge.backgroundPh')} />
            <FForgeField label={t('wiz.forge.race')} value={c.race} onChange={(v) => set({ race: v })} placeholder={t('wiz.forge.racePh')} />
            <FForgeField label={t('wiz.forge.alignment')} value={c.alignment} onChange={(v) => set({ alignment: v })} placeholder={t('wiz.forge.alignmentPh')} />
            <FForgeField label={t('wiz.forge.experience')} value={c.xp} onChange={(v) => set({ xp: onlyDigits(v) })} placeholder="0" mono />
          </div>
        </div>
      </OrdoPanel>

      {/* ── THREE COLUMNS ───────────────────────────────── */}
      <div className="forge-grid">
        {/* ─── LEFT COLUMN ─────────────────────────────── */}
        <div className="forge-col">
          <div className="forge-row2">
            <ProfBadge label={t('wiz.forge.proficiencyBonus')} value={fmtMod(prof)} sub={t('wiz.forge.level', { level: c.level })} />
            <button
              type="button"
              className={cn('forge-insp', c.inspiration && css.inspOn)}
              onClick={() => set({ inspiration: !c.inspiration })}
            >
              <Rune kind="diamond-fill" size={16} color={c.inspiration ? 'var(--gold)' : 'var(--ink-ghost)'} />
              <div className={css.taLeft}>
                <div className={cn('ao-overline', c.inspiration ? css.goldPale : css.inkQuiet)}>{t('wiz.forge.inspiration')}</div>
                <div className={cn('ao-codex', css.fs10)}>{c.inspiration ? t('wiz.forge.granted') : t('wiz.forge.tapToGrant')}</div>
              </div>
            </button>
          </div>

          {ABILITIES.map((a) => (
            <AbilityBlock
              key={a.key}
              a={a}
              score={c.scores[a.key]}
              mod={mods[a.key]}
              prof={prof}
              saveOn={!!c.saves[a.key]}
              skillsState={c.skills}
              onScore={(v) => setScore(a.key, v)}
              onToggleSave={() => toggleSave(a.key)}
              onToggleSkill={toggleSkill}
            />
          ))}

          <OrdoPanel frame padding={0}>
            <div className="forge-passive">
              <div>
                <div className="ao-overline">{t('wiz.forge.passiveWisdom')}</div>
                <div className={cn('ao-codex', css.fs10)}>{t('wiz.forge.tenPlusPerception')}</div>
              </div>
              <div className="forge-passive-num">{passivePerception}</div>
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.forge.profsLanguages')} glyph="scroll" />
            <div className={css.pad14}>
              <FForgeArea value={c.proficiencies} onChange={(v) => set({ proficiencies: v })} rows={5} placeholder={t('wiz.forge.profsPh')} />
            </div>
          </OrdoPanel>
        </div>

        {/* ─── CENTER COLUMN ───────────────────────────── */}
        <div className="forge-col">
          <div className="forge-defense">
            <DefenseBox label={t('wiz.forge.armourClass')} value={c.ac} onChange={(v) => set({ ac: Number(onlyDigits(v)) || 0 })} shield />
            <DefenseBox label={t('wiz.forge.initiative')} value={fmtMod(initiative)} readOnly sub="DEX" />
            <DefenseBox label={t('wiz.forge.speed')} value={c.speed} onChange={(v) => set({ speed: Number(onlyDigits(v)) || 0 })} sub={t('wiz.forge.feet')} />
          </div>

          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('wiz.forge.hitPoints')}
              glyph="flame"
              tone="ember"
              right={<span className="ao-codex">{c.hp.cur} / {c.hp.max}{c.hp.temp > 0 ? ' (+' + c.hp.temp + ')' : ''}</span>}
            />
            <div className={css.pad16}>
              <div className="forge-hp-fields">
                <NumField label={t('wiz.forge.maximum')} value={c.hp.max} onChange={(v) => setHp('max', Number(onlyDigits(v)) || 0)} />
                <NumField label={t('wiz.forge.current')} value={c.hp.cur} onChange={(v) => setHp('cur', Number(digitsAllowMinus(v)) || 0)} />
                <NumField label={t('wiz.forge.temporary')} value={c.hp.temp} onChange={(v) => setHp('temp', Number(onlyDigits(v)) || 0)} />
              </div>
              <div className={cn('ao-bar', css.hpBar)}>
                <div className="ao-bar-fill ao-bar-fill--gold" style={{ width: hpPct + '%' }} />
              </div>
              <div className="forge-hp-foot">
                <div className="forge-hd">
                  <label className={cn('ao-label', css.label0)}>{t('wiz.forge.hitDice')}</label>
                  <input
                    className={cn('ao-input', css.hdInput)}
                    value={c.hitDiceTotal}
                    placeholder="8d10"
                    onChange={(e) => set({ hitDiceTotal: e.target.value })}
                  />
                </div>
                <DeathSaves succ={c.deathSucc} fail={c.deathFail} onSucc={(n) => setDeath('succ', n)} onFail={(n) => setDeath('fail', n)} />
              </div>
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader
              title={t('wiz.forge.attacksSpellcasting')}
              glyph="sword"
              right={<button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={addAttack}><Rune kind="plus-sm" size={9} /> {t('wiz.forge.add')}</button>}
            />
            <div className="forge-attacks">
              <div className="forge-attack-head">
                <span className="ao-overline">{t('wiz.forge.colName')}</span>
                <span className="ao-overline">{t('wiz.forge.colAtk')}</span>
                <span className="ao-overline">{t('wiz.forge.colDamage')}</span>
                <span />
              </div>
              {c.attacks.map((atk, i) => (
                <div className="forge-attack-row" key={i}>
                  <input className="forge-cell" value={atk.name} placeholder={t('wiz.forge.attackNamePh')} onChange={(e) => setAttack(i, { name: e.target.value })} />
                  <input className={cn('forge-cell forge-cell--c', css.cellMono)} value={atk.hit} placeholder="+0" onChange={(e) => setAttack(i, { hit: e.target.value })} />
                  <input className="forge-cell" value={atk.dmg} placeholder={t('wiz.forge.attackDmgPh')} onChange={(e) => setAttack(i, { dmg: e.target.value })} />
                  <button type="button" className="forge-del" title={t('wiz.forge.remove')} onClick={() => delAttack(i)}><Rune kind="x" size={11} /></button>
                </div>
              ))}
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.forge.equipmentCoin')} glyph="coin" />
            <div className={css.pad14}>
              <div className="forge-coins">
                {COIN.map((co) => (
                  <div className="forge-coin" key={co.key}>
                    <input className="forge-coin-in" value={c.coins[co.key]} onChange={(e) => setCoin(co.key, onlyDigits(e.target.value))} />
                    <span className={cn('ao-overline', css.fs9)}>{co.label}</span>
                  </div>
                ))}
              </div>
              <FForgeArea value={c.equipment} onChange={(v) => set({ equipment: v })} rows={6} placeholder={t('wiz.forge.equipmentPh')} />
            </div>
          </OrdoPanel>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────── */}
        <div className="forge-col">
          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.forge.character')} sub={t('wiz.forge.characterSub')} glyph="eye" />
            <div className={css.colPad14}>
              <FForgeArea label={t('wiz.forge.personalityTraits')} value={c.traits} onChange={(v) => set({ traits: v })} rows={3} />
              <FForgeArea label={t('wiz.forge.ideals')} value={c.ideals} onChange={(v) => set({ ideals: v })} rows={2} />
              <FForgeArea label={t('wiz.forge.bonds')} value={c.bonds} onChange={(v) => set({ bonds: v })} rows={2} />
              <FForgeArea label={t('wiz.forge.flaws')} value={c.flaws} onChange={(v) => set({ flaws: v })} rows={2} />
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title={t('wiz.forge.featuresTraits')} sub={t('wiz.forge.featuresSub')} glyph="sigil-3" />
            <div className={css.pad14}>
              <FForgeArea value={c.features} onChange={(v) => set({ features: v })} rows={12} placeholder={t('wiz.forge.featuresPh')} />
            </div>
          </OrdoPanel>
        </div>
      </div>

      <div className="forge-footer">
        <OrdoDivider glyph="diamond-fill" />
        <span className="ao-codex">{t('wiz.forge.folioReview', { abilities: ABILITIES.length, skills: SKILLS.length, prof: fmtMod(prof) })}</span>
      </div>
    </div>
  );
}

// ── Field primitives ───────────────────────────────────────
function FForgeField({
  label, value, onChange, placeholder, mono, style,
}: {
  label?: string;
  value: string | number;
  onChange: (v: string) => void;
  placeholder?: string;
  mono?: boolean;
  style?: CSSProperties;
}) {
  return (
    <div style={style}>
      {label && <label className="ao-label">{label}</label>}
      <input
        className={cn('ao-input', css.fieldInput, mono && css.mono)}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FForgeArea({
  label, value, onChange, placeholder, rows = 4, sub,
}: {
  label?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
  sub?: string;
}) {
  return (
    <div>
      {(label || sub) && (
        <div className={css.mb6}>
          {label && <span className={cn('ao-label', css.labelInline)}>{label}</span>}
          {sub && <span className={cn('ao-codex', css.subText)}>{sub}</span>}
        </div>
      )}
      <textarea
        className={cn('ao-input ao-scroll', css.area)}
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function FProfPip({ on, title }: { on: boolean; title: string }) {
  return (
    <span
      title={title}
      className={cn(css.pip, on && css.on)}
    />
  );
}

// ── Class & Level compound field ───────────────────────────
function ClassLevelField({ c, set }: { c: WizardChar; set: (patch: Partial<WizardChar>) => void }) {
  const t = useT();
  return (
    <div>
      <label className="ao-label">{t('wiz.forge.classLevel')}</label>
      <div className="ao-row ao-gap-8">
        <input
          className={cn('ao-input', css.clsInput)}
          value={c.cls}
          placeholder={t('wiz.forge.classPh')}
          onChange={(e) => set({ cls: e.target.value })}
        />
        <input
          className={cn('ao-input', css.lvlInput)}
          type="number"
          min={1}
          max={20}
          value={c.level}
          onChange={(e) => set({ level: clamp(Number(e.target.value || 1), 1, 20) })}
        />
      </div>
    </div>
  );
}

// ── Proficiency-bonus badge ────────────────────────────────
function ProfBadge({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="forge-prof ao-frame">
      <span className="ao-frame-c" />
      <div className="forge-prof-num">{value}</div>
      <div>
        <div className="ao-overline">{label}</div>
        <div className={cn('ao-codex', css.fs10)}>{sub}</div>
      </div>
    </div>
  );
}

// ── Ability block: editable score card + saves & skills ────
function AbilityBlock({
  a, score, mod, prof, saveOn, skillsState, onScore, onToggleSave, onToggleSkill,
}: {
  a: AbilityDef;
  score: number;
  mod: number;
  prof: number;
  saveOn: boolean;
  skillsState: Record<string, boolean>;
  onScore: (v: number) => void;
  onToggleSave: () => void;
  onToggleSkill: (k: string) => void;
}) {
  const t = useT();
  const gt = useGameTerms();
  const skills = SKILLS.filter((s) => s.abil === a.key);
  const saveBonus = mod + (saveOn ? prof : 0);
  return (
    <div className="forge-ability">
      <div className="forge-ability-card">
        <div className="ao-stat-label">{gt.abilityAbbr(a.abbr)}</div>
        <input
          className="forge-score"
          value={score}
          onChange={(e) => onScore(clamp(Number(e.target.value.replace(/[^0-9]/g, '') || 0), 1, 30))}
        />
        <div className="forge-modchip">{fmtMod(mod)}</div>
      </div>
      <div className="forge-skills">
        <button type="button" className="forge-skill" onClick={onToggleSave}>
          <FProfPip on={saveOn} title={t('wiz.forge.saveProficiency')} />
          <span className={cn('forge-skill-label', css.inkLabel)}>{t('wiz.forge.savingThrow')}</span>
          <span className="forge-skill-num">{fmtMod(saveBonus)}</span>
        </button>
        {skills.map((s) => {
          const on = !!skillsState[s.key];
          const bonus = mod + (on ? prof : 0);
          return (
            <button type="button" className="forge-skill" key={s.key} onClick={() => onToggleSkill(s.key)}>
              <FProfPip on={on} title={t('wiz.forge.skillProficiency')} />
              <span className="forge-skill-label">{gt.skill(s.label)}</span>
              <span className="forge-skill-num">{fmtMod(bonus)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Defense box (AC / Init / Speed) ────────────────────────
function DefenseBox({
  label, value, onChange, readOnly, sub, shield,
}: {
  label: string;
  value: string | number;
  onChange?: (v: string) => void;
  readOnly?: boolean;
  sub?: string;
  shield?: boolean;
}) {
  return (
    <div className={'forge-defbox ao-frame' + (shield ? ' forge-defbox--shield' : '')}>
      <span className="ao-frame-c" />
      <div className={cn('ao-overline', css.defLabel)}>{label}</div>
      {readOnly || !onChange ? (
        <div className="forge-defnum">{value}</div>
      ) : (
        <input className="forge-defnum forge-defnum--in" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {sub && <div className={cn('ao-codex', css.fs9)}>{sub}</div>}
    </div>
  );
}

// ── Small labelled number field ────────────────────────────
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="forge-numfield">
      <label className={cn('ao-label', css.numLabel)}>{label}</label>
      <input
        className={cn('ao-input', css.numInput)}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

// ── Death saves ────────────────────────────────────────────
function DeathSaves({
  succ, fail, onSucc, onFail,
}: {
  succ: number;
  fail: number;
  onSucc: (n: number) => void;
  onFail: (n: number) => void;
}) {
  const t = useT();
  const Row = ({ label, n, on, color }: { label: string; n: number; on: (i: number) => void; color: string }) => (
    <div className="forge-death-row">
      <span className={cn('ao-overline', css.deathLabel)}>{label}</span>
      <div className="ao-row ao-gap-6">
        {[1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className={cn('forge-death-pip', i <= n && css.deathPipOn)}
            onClick={() => on(i)}
            style={{ '--pip-color': color } as CSSProperties}
          />
        ))}
      </div>
    </div>
  );
  return (
    <div className="forge-death">
      <div className={cn('ao-overline', css.deathHead)}>{t('wiz.forge.deathSaves')}</div>
      <Row label={t('wiz.forge.successes')} n={succ} on={onSucc} color="var(--verdigris)" />
      <Row label={t('wiz.forge.failures')} n={fail} on={onFail} color="var(--ember)" />
    </div>
  );
}
