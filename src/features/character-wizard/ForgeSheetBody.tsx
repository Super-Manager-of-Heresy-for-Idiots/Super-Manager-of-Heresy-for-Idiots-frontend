// ============================================================
// Forge sheet body — the full, editable D&D 5e character sheet
// used as the Wizard's final "Summary" step (ported from the
// reference Character Forge design). Driven by { c, onChange }.
// ============================================================
import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
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
                <img src={c.avatar} alt="portrait" />
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <label className="ao-label">Character Name</label>
              <input
                className="ao-input"
                value={c.name}
                placeholder="Name the soul…"
                onChange={(e) => set({ name: e.target.value })}
                style={{ fontFamily: 'var(--font-serif)', fontSize: 30, color: 'var(--ink-bright)', letterSpacing: '-0.01em' }}
              />
            </div>
          </div>
          <div className="forge-header-meta">
            <ClassLevelField c={c} set={set} />
            <FForgeField label="Background" value={c.background} onChange={(v) => set({ background: v })} placeholder="Acolyte-Marshal" />
            <FForgeField label="Player Name" value={c.player} onChange={(v) => set({ player: v })} placeholder="Chronicler" />
            <FForgeField label="Race" value={c.race} onChange={(v) => set({ race: v })} placeholder="Half-Elf" />
            <FForgeField label="Alignment" value={c.alignment} onChange={(v) => set({ alignment: v })} placeholder="Lawful Grave" />
            <FForgeField label="Experience" value={c.xp} onChange={(v) => set({ xp: onlyDigits(v) })} placeholder="0" mono />
          </div>
        </div>
      </OrdoPanel>

      {/* ── THREE COLUMNS ───────────────────────────────── */}
      <div className="forge-grid">
        {/* ─── LEFT COLUMN ─────────────────────────────── */}
        <div className="forge-col">
          <div className="forge-row2">
            <ProfBadge label="Proficiency Bonus" value={fmtMod(prof)} sub={'Level ' + c.level} />
            <button
              type="button"
              className="forge-insp"
              onClick={() => set({ inspiration: !c.inspiration })}
              style={{
                borderColor: c.inspiration ? 'var(--brass)' : 'var(--rule)',
                background: c.inspiration ? 'linear-gradient(180deg, rgba(176,141,78,0.12), transparent)' : 'var(--abyss)',
              }}
            >
              <Rune kind="diamond-fill" size={16} color={c.inspiration ? 'var(--gold)' : 'var(--ink-ghost)'} />
              <div style={{ textAlign: 'left' }}>
                <div className="ao-overline" style={{ color: c.inspiration ? 'var(--gold-pale)' : 'var(--ink-quiet)' }}>Inspiration</div>
                <div className="ao-codex" style={{ fontSize: 10 }}>{c.inspiration ? 'Granted' : 'Tap to grant'}</div>
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
                <div className="ao-overline">Passive Wisdom</div>
                <div className="ao-codex" style={{ fontSize: 10 }}>10 + Perception</div>
              </div>
              <div className="forge-passive-num">{passivePerception}</div>
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title="Proficiencies & Languages" glyph="scroll" />
            <div style={{ padding: 14 }}>
              <FForgeArea value={c.proficiencies} onChange={(v) => set({ proficiencies: v })} rows={5} placeholder="Armour, weapons, tools, languages…" />
            </div>
          </OrdoPanel>
        </div>

        {/* ─── CENTER COLUMN ───────────────────────────── */}
        <div className="forge-col">
          <div className="forge-defense">
            <DefenseBox label="Armour Class" value={c.ac} onChange={(v) => set({ ac: Number(onlyDigits(v)) || 0 })} shield />
            <DefenseBox label="Initiative" value={fmtMod(initiative)} readOnly sub="DEX" />
            <DefenseBox label="Speed" value={c.speed} onChange={(v) => set({ speed: Number(onlyDigits(v)) || 0 })} sub="feet" />
          </div>

          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="Hit Points"
              glyph="flame"
              tone="ember"
              right={<span className="ao-codex">{c.hp.cur} / {c.hp.max}{c.hp.temp > 0 ? ' (+' + c.hp.temp + ')' : ''}</span>}
            />
            <div style={{ padding: 16 }}>
              <div className="forge-hp-fields">
                <NumField label="Maximum" value={c.hp.max} onChange={(v) => setHp('max', Number(onlyDigits(v)) || 0)} />
                <NumField label="Current" value={c.hp.cur} onChange={(v) => setHp('cur', Number(digitsAllowMinus(v)) || 0)} />
                <NumField label="Temporary" value={c.hp.temp} onChange={(v) => setHp('temp', Number(onlyDigits(v)) || 0)} />
              </div>
              <div className="ao-bar" style={{ marginTop: 14, height: 8 }}>
                <div className="ao-bar-fill ao-bar-fill--gold" style={{ width: hpPct + '%' }} />
              </div>
              <div className="forge-hp-foot">
                <div className="forge-hd">
                  <label className="ao-label" style={{ margin: 0 }}>Hit Dice</label>
                  <input
                    className="ao-input"
                    value={c.hitDiceTotal}
                    placeholder="8d10"
                    onChange={(e) => set({ hitDiceTotal: e.target.value })}
                    style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', color: 'var(--ink-bright)' }}
                  />
                </div>
                <DeathSaves succ={c.deathSucc} fail={c.deathFail} onSucc={(n) => setDeath('succ', n)} onFail={(n) => setDeath('fail', n)} />
              </div>
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader
              title="Attacks & Spellcasting"
              glyph="sword"
              right={<button className="ao-btn ao-btn--ghost ao-btn--sm" onClick={addAttack}><Rune kind="plus-sm" size={9} /> Add</button>}
            />
            <div className="forge-attacks">
              <div className="forge-attack-head">
                <span className="ao-overline">Name</span>
                <span className="ao-overline">Atk</span>
                <span className="ao-overline">Damage / Type</span>
                <span />
              </div>
              {c.attacks.map((atk, i) => (
                <div className="forge-attack-row" key={i}>
                  <input className="forge-cell" value={atk.name} placeholder="Weapon / cantrip" onChange={(e) => setAttack(i, { name: e.target.value })} />
                  <input className="forge-cell forge-cell--c" value={atk.hit} placeholder="+0" onChange={(e) => setAttack(i, { hit: e.target.value })} style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-pale)' }} />
                  <input className="forge-cell" value={atk.dmg} placeholder="1d8 + 3 · type" onChange={(e) => setAttack(i, { dmg: e.target.value })} />
                  <button type="button" className="forge-del" title="Remove" onClick={() => delAttack(i)}><Rune kind="x" size={11} /></button>
                </div>
              ))}
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title="Equipment & Coin" glyph="coin" />
            <div style={{ padding: 14 }}>
              <div className="forge-coins">
                {COIN.map((co) => (
                  <div className="forge-coin" key={co.key}>
                    <input className="forge-coin-in" value={c.coins[co.key]} onChange={(e) => setCoin(co.key, onlyDigits(e.target.value))} />
                    <span className="ao-overline" style={{ fontSize: 9 }}>{co.label}</span>
                  </div>
                ))}
              </div>
              <FForgeArea value={c.equipment} onChange={(v) => set({ equipment: v })} rows={6} placeholder="Carried gear, one per line…" />
            </div>
          </OrdoPanel>
        </div>

        {/* ─── RIGHT COLUMN ────────────────────────────── */}
        <div className="forge-col">
          <OrdoPanel frame padding={0}>
            <PanelHeader title="Character" sub="Traits · Ideals · Bonds · Flaws" glyph="eye" />
            <div style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <FForgeArea label="Personality Traits" value={c.traits} onChange={(v) => set({ traits: v })} rows={3} />
              <FForgeArea label="Ideals" value={c.ideals} onChange={(v) => set({ ideals: v })} rows={2} />
              <FForgeArea label="Bonds" value={c.bonds} onChange={(v) => set({ bonds: v })} rows={2} />
              <FForgeArea label="Flaws" value={c.flaws} onChange={(v) => set({ flaws: v })} rows={2} />
            </div>
          </OrdoPanel>

          <OrdoPanel frame padding={0}>
            <PanelHeader title="Features & Traits" sub="Class · race · feats" glyph="sigil-3" />
            <div style={{ padding: 14 }}>
              <FForgeArea value={c.features} onChange={(v) => set({ features: v })} rows={12} placeholder="Class features, racial traits, feats…" />
            </div>
          </OrdoPanel>
        </div>
      </div>

      <div className="forge-footer">
        <OrdoDivider glyph="diamond-fill" />
        <span className="ao-codex">Folio review · {ABILITIES.length} abilities · {SKILLS.length} skills · prof {fmtMod(prof)}</span>
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
        className="ao-input"
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)', color: 'var(--ink-bright)' }}
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
        <div style={{ marginBottom: 6 }}>
          {label && <span className="ao-label" style={{ display: 'inline', letterSpacing: '0.14em' }}>{label}</span>}
          {sub && <span className="ao-codex" style={{ fontSize: 10, marginLeft: 8 }}>{sub}</span>}
        </div>
      )}
      <textarea
        className="ao-input ao-scroll"
        value={value}
        rows={rows}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        style={{ fontFamily: 'var(--font-serif)', fontSize: 15, lineHeight: 1.5, color: 'var(--ink)', resize: 'vertical', minHeight: 64 }}
      />
    </div>
  );
}

function FProfPip({ on, title }: { on: boolean; title: string }) {
  return (
    <span
      title={title}
      style={{
        width: 14, height: 14, flexShrink: 0, display: 'block', pointerEvents: 'none',
        background: on ? 'var(--gold)' : 'transparent',
        border: '1px solid ' + (on ? 'var(--brass)' : 'var(--rule)'),
        transform: 'rotate(45deg)',
        boxShadow: on ? '0 0 6px rgba(176,141,78,0.5)' : 'none',
        transition: 'all 150ms',
      }}
    />
  );
}

// ── Class & Level compound field ───────────────────────────
function ClassLevelField({ c, set }: { c: WizardChar; set: (patch: Partial<WizardChar>) => void }) {
  return (
    <div>
      <label className="ao-label">Class &amp; Level</label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="ao-input"
          value={c.cls}
          placeholder="Paladin"
          onChange={(e) => set({ cls: e.target.value })}
          style={{ color: 'var(--ink-bright)', flex: 1 }}
        />
        <input
          className="ao-input"
          type="number"
          min={1}
          max={20}
          value={c.level}
          onChange={(e) => set({ level: clamp(Number(e.target.value || 1), 1, 20) })}
          style={{ width: 64, textAlign: 'center', fontFamily: 'var(--font-mono)', color: 'var(--gold-pale)' }}
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
        <div className="ao-codex" style={{ fontSize: 10 }}>{sub}</div>
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
  const skills = SKILLS.filter((s) => s.abil === a.key);
  const saveBonus = mod + (saveOn ? prof : 0);
  return (
    <div className="forge-ability">
      <div className="forge-ability-card">
        <div className="ao-stat-label">{a.abbr}</div>
        <input
          className="forge-score"
          value={score}
          onChange={(e) => onScore(clamp(Number(e.target.value.replace(/[^0-9]/g, '') || 0), 1, 30))}
        />
        <div className="forge-modchip">{fmtMod(mod)}</div>
      </div>
      <div className="forge-skills">
        <button type="button" className="forge-skill" onClick={onToggleSave}>
          <FProfPip on={saveOn} title="Saving-throw proficiency" />
          <span className="forge-skill-label" style={{ color: 'var(--ink)' }}>Saving Throw</span>
          <span className="forge-skill-num">{fmtMod(saveBonus)}</span>
        </button>
        {skills.map((s) => {
          const on = !!skillsState[s.key];
          const bonus = mod + (on ? prof : 0);
          return (
            <button type="button" className="forge-skill" key={s.key} onClick={() => onToggleSkill(s.key)}>
              <FProfPip on={on} title="Skill proficiency" />
              <span className="forge-skill-label">{s.label}</span>
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
      <div className="ao-overline" style={{ fontSize: 9, textAlign: 'center' }}>{label}</div>
      {readOnly || !onChange ? (
        <div className="forge-defnum">{value}</div>
      ) : (
        <input className="forge-defnum forge-defnum--in" value={value} onChange={(e) => onChange(e.target.value)} />
      )}
      {sub && <div className="ao-codex" style={{ fontSize: 9 }}>{sub}</div>}
    </div>
  );
}

// ── Small labelled number field ────────────────────────────
function NumField({ label, value, onChange }: { label: string; value: number; onChange: (v: string) => void }) {
  return (
    <div className="forge-numfield">
      <label className="ao-label" style={{ textAlign: 'center', margin: '0 0 6px' }}>{label}</label>
      <input
        className="ao-input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        style={{ textAlign: 'center', fontFamily: 'var(--font-serif)', fontSize: 22, color: 'var(--ink-bright)' }}
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
  const Row = ({ label, n, on, color }: { label: string; n: number; on: (i: number) => void; color: string }) => (
    <div className="forge-death-row">
      <span className="ao-overline" style={{ fontSize: 9, width: 64 }}>{label}</span>
      <div style={{ display: 'flex', gap: 6 }}>
        {[1, 2, 3].map((i) => (
          <button
            key={i}
            type="button"
            className="forge-death-pip"
            onClick={() => on(i)}
            style={{ background: i <= n ? color : 'transparent', borderColor: i <= n ? color : 'var(--rule)' }}
          />
        ))}
      </div>
    </div>
  );
  return (
    <div className="forge-death">
      <div className="ao-overline" style={{ fontSize: 9, marginBottom: 6 }}>Death Saves</div>
      <Row label="Successes" n={succ} on={onSucc} color="var(--verdigris)" />
      <Row label="Failures" n={fail} on={onFail} color="var(--ember)" />
    </div>
  );
}
