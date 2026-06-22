// ============================================================
// Character Wizard — state shape, derivation (recompute),
// per-step validation, and the reducer. Pure logic, no JSX.
// ============================================================
import {
  ABILITIES,
  POINT_BUY_BUDGET,
  applyRacial,
  abilityMod,
  pointBuySpent,
  rollStats,
  spellLimits,
  type AbilityKey,
  type ASI,
  type ScoreMap,
} from '@/data/wizard5e';
import type { ChildSelections } from '@/pages/gm/campaigns/contentLevelUp';

export type ScoreMethod = 'standard' | 'pointbuy' | 'roll';

export interface WizardChar {
  // identity
  name: string;
  alignment: string;
  level: number;
  // race
  raceKey: string;
  subraceKey: string;
  race: string;
  speed: number;
  // combined race + subrace ability-score increase (from API detail)
  racialAsi: ASI;
  raceTraits: string[];
  // class
  classKey: string;
  cls: string;
  classSlug: string;
  classDesc: string;
  isSpellcaster: boolean;
  hasCantrips: boolean;
  isHalfCaster: boolean;
  hitDiceType: string;
  hitDiceTotal: string;
  saves: Partial<Record<AbilityKey, boolean>>;
  ac: number;
  hp: { max: number; cur: number; temp: number };
  // content-shaped level-1 reward selections: group key -> selected option ids
  contentRewardSelections: Record<string, string[]>;
  // grant id -> child selections for ability/skill/spell grants
  contentRewardChildSelections: ChildSelections;
  // abilities
  baseScores: ScoreMap;
  scores: ScoreMap;
  scoreMethod: ScoreMethod;
  rolledPool: number[];
  // background & skills
  backgroundKey: string;
  background: string;
  bgDesc: string;
  bgExtra: string;
  classSkills: string[];
  bgSkills: string[];
  skills: Record<string, boolean>;
  // spells
  spells: { cantrips: string[]; known: string[] };
  // narrative / derived text
  proficiencies: string;
  features: string;
  // portrait
  avatar: string | null;
  // ── full sheet fields (edited on the Summary / Forge step) ──
  xp: string;
  inspiration: boolean;
  attacks: ForgeAttack[];
  coins: Record<CoinKey, string>;
  equipment: string;
  traits: string;
  ideals: string;
  bonds: string;
  flaws: string;
  deathSucc: number;
  deathFail: number;
}

export type CoinKey = 'pp' | 'gp' | 'ep' | 'sp' | 'cp';
export interface ForgeAttack {
  name: string;
  hit: string;
  dmg: string;
  type: string;
}

export interface WizardState {
  step: number;
  furthest: number;
  c: WizardChar;
}

export type StepId = 'basics' | 'race' | 'class' | 'abilities' | 'background' | 'spells' | 'summary';

export interface StepDef {
  id: StepId;
  labelKey: string;
  glyph: string;
  spellOnly?: boolean;
}

export const ALL_STEPS: StepDef[] = [
  { id: 'basics', labelKey: 'wiz.step.basics', glyph: 'diamond-fill' },
  { id: 'race', labelKey: 'wiz.step.race', glyph: 'hex' },
  { id: 'class', labelKey: 'wiz.step.class', glyph: 'sword' },
  { id: 'abilities', labelKey: 'wiz.step.abilities', glyph: 'cir-dot' },
  { id: 'background', labelKey: 'wiz.step.background', glyph: 'scroll' },
  { id: 'spells', labelKey: 'wiz.step.spells', glyph: 'sigil-1', spellOnly: true },
  { id: 'summary', labelKey: 'wiz.step.summary', glyph: 'book' },
];

export const zeroScores = (): ScoreMap => ({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
export const eightScores = (): ScoreMap => ({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });

export function initialChar(): WizardChar {
  return {
    name: '', alignment: '', level: 1,
    raceKey: '', subraceKey: '', race: '', speed: 30,
    racialAsi: {}, raceTraits: [],
    classKey: '', cls: '', classSlug: '', classDesc: '',
    isSpellcaster: false, hasCantrips: false, isHalfCaster: false,
    hitDiceType: 'd8', hitDiceTotal: '',
    saves: {}, ac: 10, hp: { max: 0, cur: 0, temp: 0 },
    contentRewardSelections: {},
    contentRewardChildSelections: {},
    baseScores: zeroScores(), scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    scoreMethod: 'standard', rolledPool: [],
    backgroundKey: '', background: '', bgDesc: '', bgExtra: '', classSkills: [], bgSkills: [], skills: {},
    spells: { cantrips: [], known: [] },
    proficiencies: '', features: '',
    avatar: null,
    xp: '0', inspiration: false,
    attacks: [{ name: '', hit: '', dmg: '', type: '' }],
    coins: { pp: '0', gp: '0', ep: '0', sp: '0', cp: '0' },
    equipment: '', traits: '', ideals: '', bonds: '', flaws: '',
    deathSucc: 0, deathFail: 0,
  };
}

// ── Project wizard selections → derived sheet fields ───────
// All inputs come from stored WizardChar fields, populated by the actions from
// the backend reference detail — no local content lookups.
export function recompute(c: WizardChar): WizardChar {
  const next: WizardChar = { ...c };

  next.scores = applyRacial(c.baseScores, c.racialAsi || {});

  next.race = c.race;
  next.speed = c.speed || 30;

  next.cls = c.cls;
  next.hitDiceType = c.hitDiceType || 'd8';
  next.hitDiceTotal = c.level + (next.hitDiceType || 'd8');
  next.isSpellcaster = c.isSpellcaster;
  next.saves = c.saves || {};
  const hitDie = Number((next.hitDiceType || 'd8').replace('d', '')) || 8;
  const conMod = abilityMod(next.scores.con);
  const perLvl = Math.floor(hitDie / 2) + 1;
  const maxHp = Math.max(1, hitDie + conMod + (c.level - 1) * (perLvl + conMod));
  next.hp = { max: maxHp, cur: maxHp, temp: 0 };
  next.ac = 10 + abilityMod(next.scores.dex);

  const skillSet: Record<string, boolean> = {};
  (c.bgSkills || []).forEach((k) => { skillSet[k] = true; });
  (c.classSkills || []).forEach((k) => { skillSet[k] = true; });
  next.skills = skillSet;

  const profLines: string[] = [];
  if (c.proficiencies) profLines.push(c.proficiencies);
  if (c.bgExtra) profLines.push('Background: ' + c.bgExtra);
  next.proficiencies = profLines.join('\n');

  const feat: string[] = [];
  if (c.cls) feat.push(c.cls + (c.classDesc ? ' \u2014 ' + c.classDesc : ''));
  if (c.race) {
    feat.push(c.raceTraits.length
      ? c.race + ' traits: ' + c.raceTraits.join(', ')
      : c.race + ' traits are defined by campaign content');
  }
  if (c.background) feat.push(c.background + (c.bgDesc ? ' \u2014 ' + c.bgDesc : ''));
  const cantrips = c.spells.cantrips || [];
  const known = c.spells.known || [];
  if (cantrips.length || known.length) {
    feat.push('');
    if (cantrips.length) feat.push('Cantrips: ' + cantrips.join(', '));
    if (known.length) feat.push('Spells: ' + known.join(', '));
  }
  next.features = feat.join('\n');
  return next;
}

/**
 * Characters are always created at level 1 — the wizard's `level` field is the
 * *target* level (the backend turns it into an XP threshold). The spell loadout
 * and the highest selectable spell level are therefore sized for level 1, not the
 * target level; otherwise the create request carries over-level spells the backend
 * rejects ("Spell (level X) exceeds max spell level …").
 */
export const CREATION_LEVEL = 1;

// Spell-count rule derived from the selected class's stored caster flags.
const casterKind = (c: WizardChar) => ({
  isSpellcaster: c.isSpellcaster,
  hasCantrips: c.hasCantrips,
  isHalfCaster: c.isHalfCaster,
  kind: c.classSlug,
});

// ── Per-step validation ────────────────────────────────────
// Race subrace, class reward groups and class skill count are gated by
// `validateCampaignReferences` in CharacterCreationWizard (it has the API detail).
export function validate(id: StepId, c: WizardChar): boolean {
  switch (id) {
    case 'basics':
      return c.name.trim().length > 0;
    case 'race':
      return !!c.raceKey;
    case 'class':
      return !!c.classKey;
    case 'abilities': {
      const allAssigned = ABILITIES.every((a) => (c.baseScores[a.key] || 0) > 0);
      if (!allAssigned) return false;
      if (c.scoreMethod === 'pointbuy') return pointBuySpent(c.baseScores) <= POINT_BUY_BUDGET;
      return true;
    }
    case 'background':
      return !!c.backgroundKey;
    case 'spells': {
      const lim = spellLimits(casterKind(c), CREATION_LEVEL);
      return (c.spells.cantrips || []).length === lim.cantrips && (c.spells.known || []).length === lim.spells;
    }
    default:
      return true;
  }
}

/**
 * A localisable hint: `key` is a translation key (empty string = no hint),
 * `vars` carries interpolation values for the dictionary placeholders.
 */
export interface RequirementHint {
  key: string;
  vars?: Record<string, string | number>;
}

export function requirementHint(id: StepId, c: WizardChar): RequirementHint {
  switch (id) {
    case 'basics':
      return { key: 'wiz.hint.enterName' };
    case 'race':
      // Once a race is picked, defer to the campaign-reference hint (subrace choice).
      return c.raceKey ? { key: '' } : { key: 'wiz.hint.chooseRace' };
    case 'class':
      // Once a class is picked, defer to the campaign-reference hint (reward choices).
      return c.classKey ? { key: '' } : { key: 'wiz.hint.chooseClass' };
    case 'abilities': {
      if (!ABILITIES.every((a) => (c.baseScores[a.key] || 0) > 0)) return { key: 'wiz.hint.assignAbilities' };
      if (c.scoreMethod === 'pointbuy' && pointBuySpent(c.baseScores) > POINT_BUY_BUDGET) return { key: 'wiz.hint.overBudget' };
      return { key: '' };
    }
    case 'background':
      // Class skill count is gated by the campaign-reference hint.
      return c.backgroundKey ? { key: '' } : { key: 'wiz.hint.chooseBackground' };
    case 'spells': {
      const lim = spellLimits(casterKind(c), CREATION_LEVEL);
      return { key: 'wiz.hint.chooseSpells', vars: { cantrips: lim.cantrips, spells: lim.spells } };
    }
    default:
      return { key: '' };
  }
}

export type WizardAction =
  | { type: 'setC'; c: WizardChar }
  | { type: 'goto'; step: number }
  | { type: 'setStep'; step: number }
  | { type: 'reset' };

export function freshState(): WizardState {
  return { step: 0, furthest: 0, c: initialChar() };
}

export function reducer(st: WizardState, ac: WizardAction): WizardState {
  switch (ac.type) {
    case 'setC':
      return { ...st, c: ac.c };
    case 'goto':
      return { ...st, step: ac.step, furthest: Math.max(st.furthest, ac.step) };
    case 'setStep':
      return { ...st, step: ac.step };
    case 'reset':
      return freshState();
    default:
      return st;
  }
}

// ── Action helpers factory ─────────────────────────────────
export interface RaceMeta {
  racialAsi?: ASI;
  speed?: number;
  traits?: string[];
}

export interface SubraceMeta extends RaceMeta {
  raceLabel?: string;
}

export interface ClassMeta {
  hitDie?: number;
  isSpellcaster?: boolean;
  hasCantrips?: boolean;
  isHalfCaster?: boolean;
  saves?: AbilityKey[];
  proficiencies?: string;
  slug?: string;
  classDesc?: string;
}

export interface BackgroundMeta {
  desc?: string;
  extra?: string;
}

export interface WizardActions {
  patch: (patch: Partial<WizardChar>) => void;
  setLevel: (n: number) => void;
  setRace: (key: string, label?: string, meta?: RaceMeta) => void;
  setSubrace: (key: string, meta?: SubraceMeta) => void;
  setClass: (key: string, label?: string, meta?: ClassMeta) => void;
  setMethod: (m: ScoreMethod) => void;
  setBaseScore: (abil: AbilityKey, val: number) => void;
  rollPool: () => void;
  setBackground: (key: string, label?: string, bgSkills?: string[], meta?: BackgroundMeta) => void;
  toggleClassSkill: (key: string) => void;
  toggleSpell: (kind: 'cantrips' | 'known', name: string) => void;
  setAvatar: (data: string | null) => void;
}

export function makeActions(c: WizardChar, setC: (c: WizardChar) => void): WizardActions {
  const rawPatch = (patch: Partial<WizardChar>) => setC({ ...c, ...patch });
  const derivePatch = (patch: Partial<WizardChar>) => setC(recompute({ ...c, ...patch }));
  return {
    patch: rawPatch,
    setLevel: (n) => derivePatch({ level: n }),
    setRace: (key, label, meta) => {
      setC(recompute({
        ...c,
        raceKey: key,
        subraceKey: '',
        race: label ?? c.race,
        racialAsi: meta?.racialAsi ?? {},
        speed: meta?.speed ?? 30,
        raceTraits: meta?.traits ?? [],
      }));
    },
    setSubrace: (key, meta) => derivePatch({
      subraceKey: key,
      race: meta?.raceLabel ?? c.race,
      racialAsi: meta?.racialAsi ?? c.racialAsi,
      speed: meta?.speed ?? c.speed,
      raceTraits: meta?.traits ?? c.raceTraits,
    }),
    setClass: (key, label, meta) => {
      setC(recompute({
        ...c,
        classKey: key,
        cls: label ?? c.cls,
        classSlug: meta?.slug ?? '',
        classDesc: meta?.classDesc ?? '',
        hitDiceType: 'd' + (meta?.hitDie || 8),
        isSpellcaster: !!meta?.isSpellcaster,
        hasCantrips: !!meta?.hasCantrips,
        isHalfCaster: !!meta?.isHalfCaster,
        saves: meta?.saves?.reduce<Partial<Record<AbilityKey, boolean>>>((acc, save) => {
          acc[save] = true;
          return acc;
        }, {}) || {},
        proficiencies: meta?.proficiencies || '',
        classSkills: [],
        spells: { cantrips: [], known: [] },
        contentRewardSelections: {},
        contentRewardChildSelections: {},
      }));
    },
    setMethod: (m) => setC(recompute({
      ...c,
      scoreMethod: m,
      baseScores: m === 'pointbuy' ? eightScores() : zeroScores(),
      rolledPool: m === 'roll' ? (c.rolledPool && c.rolledPool.length ? c.rolledPool : []) : [],
    })),
    setBaseScore: (abil, val) => derivePatch({ baseScores: { ...c.baseScores, [abil]: val } }),
    rollPool: () => setC(recompute({ ...c, rolledPool: rollStats(), baseScores: zeroScores() })),
    setBackground: (key, label, dbBgSkills, meta) => {
      const bgSkills = dbBgSkills || [];
      const classSkills = (c.classSkills || []).filter((s) => !bgSkills.includes(s));
      setC(recompute({
        ...c,
        backgroundKey: key,
        background: label ?? c.background,
        bgDesc: meta?.desc ?? '',
        bgExtra: meta?.extra ?? '',
        bgSkills,
        classSkills,
      }));
    },
    toggleClassSkill: (key) => {
      const arr = c.classSkills || [];
      const next = arr.includes(key) ? arr.filter((x) => x !== key) : [...arr, key];
      derivePatch({ classSkills: next });
    },
    toggleSpell: (kind, name) => {
      const cur = c.spells[kind] || [];
      const next = cur.includes(name) ? cur.filter((x) => x !== name) : [...cur, name];
      derivePatch({ spells: { ...c.spells, [kind]: next } });
    },
    setAvatar: (data) => rawPatch({ avatar: data }),
  };
}
