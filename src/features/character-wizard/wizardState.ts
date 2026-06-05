// ============================================================
// Character Wizard — state shape, derivation (recompute),
// per-step validation, and the reducer. Pure logic, no JSX.
// ============================================================
import {
  ABILITIES,
  POINT_BUY_BUDGET,
  applyRacial,
  bgByKey,
  classByKey,
  combinedASI,
  abilityMod,
  pointBuySpent,
  raceByKey,
  rollStats,
  spellLimits,
  type AbilityKey,
  type ScoreMap,
} from '@/data/wizard5e';

export type ScoreMethod = 'standard' | 'pointbuy' | 'roll';

export interface WizardChar {
  // identity
  name: string;
  player: string;
  alignment: string;
  level: number;
  // race
  raceKey: string;
  subraceKey: string;
  race: string;
  speed: number;
  // class
  classKey: string;
  cls: string;
  isSpellcaster: boolean;
  hitDiceType: string;
  hitDiceTotal: string;
  saves: Partial<Record<AbilityKey, boolean>>;
  ac: number;
  hp: { max: number; cur: number; temp: number };
  // abilities
  baseScores: ScoreMap;
  scores: ScoreMap;
  scoreMethod: ScoreMethod;
  rolledPool: number[];
  // background & skills
  backgroundKey: string;
  background: string;
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
}

export interface WizardState {
  step: number;
  furthest: number;
  c: WizardChar;
}

export type StepId = 'basics' | 'race' | 'class' | 'abilities' | 'background' | 'spells' | 'summary';

export interface StepDef {
  id: StepId;
  label: string;
  glyph: string;
  spellOnly?: boolean;
}

export const ALL_STEPS: StepDef[] = [
  { id: 'basics', label: 'Basics', glyph: 'diamond-fill' },
  { id: 'race', label: 'Race', glyph: 'hex' },
  { id: 'class', label: 'Class', glyph: 'sword' },
  { id: 'abilities', label: 'Abilities', glyph: 'cir-dot' },
  { id: 'background', label: 'Origin', glyph: 'scroll' },
  { id: 'spells', label: 'Spells', glyph: 'sigil-1', spellOnly: true },
  { id: 'summary', label: 'Summary', glyph: 'book' },
];

export const zeroScores = (): ScoreMap => ({ str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 });
export const eightScores = (): ScoreMap => ({ str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 });

export function initialChar(): WizardChar {
  return {
    name: '', player: '', alignment: '', level: 1,
    raceKey: '', subraceKey: '', race: '', speed: 30,
    classKey: '', cls: '', isSpellcaster: false, hitDiceType: 'd8', hitDiceTotal: '',
    saves: {}, ac: 10, hp: { max: 0, cur: 0, temp: 0 },
    baseScores: zeroScores(), scores: { str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 },
    scoreMethod: 'standard', rolledPool: [],
    backgroundKey: '', background: '', classSkills: [], bgSkills: [], skills: {},
    spells: { cantrips: [], known: [] },
    proficiencies: '', features: '',
    avatar: null,
  };
}

// ── Project wizard selections → derived sheet fields ───────
export function recompute(c: WizardChar): WizardChar {
  const race = raceByKey(c.raceKey);
  const cls = classByKey(c.classKey);
  const bg = bgByKey(c.backgroundKey);
  const next: WizardChar = { ...c };

  next.scores = applyRacial(c.baseScores, combinedASI(race, c.subraceKey));

  if (race) {
    const sub = (race.subraces || []).find((s) => s.key === c.subraceKey);
    next.race = race.label + (sub ? ' (' + sub.label + ')' : '');
    next.speed = (sub && sub.speed) || race.speed;
  } else {
    next.race = c.race;
    next.speed = c.speed || 30;
  }

  if (cls) {
    next.cls = cls.label;
    next.hitDiceType = 'd' + cls.hitDie;
    next.hitDiceTotal = c.level + 'd' + cls.hitDie;
    next.isSpellcaster = !!cls.spellcaster;
    const saves: Partial<Record<AbilityKey, boolean>> = {};
    cls.saves.forEach((s) => { saves[s] = true; });
    next.saves = saves;
    const conMod = abilityMod(next.scores.con);
    const perLvl = Math.floor(cls.hitDie / 2) + 1;
    const maxHp = Math.max(1, cls.hitDie + conMod + (c.level - 1) * (perLvl + conMod));
    next.hp = { max: maxHp, cur: maxHp, temp: 0 };
    next.ac = 10 + abilityMod(next.scores.dex);
  } else {
    next.cls = c.cls;
    next.hitDiceType = c.hitDiceType || 'd8';
    next.hitDiceTotal = c.level + (next.hitDiceType || 'd8');
    next.isSpellcaster = false;
    next.saves = c.saves || {};
    const hitDie = Number((next.hitDiceType || 'd8').replace('d', '')) || 8;
    const conMod = abilityMod(next.scores.con);
    const perLvl = Math.floor(hitDie / 2) + 1;
    const maxHp = Math.max(1, hitDie + conMod + (c.level - 1) * (perLvl + conMod));
    next.hp = { max: maxHp, cur: maxHp, temp: 0 };
    next.ac = 10 + abilityMod(next.scores.dex);
  }

  const skillSet: Record<string, boolean> = {};
  (c.bgSkills || []).forEach((k) => { skillSet[k] = true; });
  (c.classSkills || []).forEach((k) => { skillSet[k] = true; });
  next.skills = skillSet;

  const profLines: string[] = [];
  if (cls) profLines.push('Weapons & armour: ' + cls.profs);
  if (bg) profLines.push('Background: ' + bg.extra);
  next.proficiencies = profLines.join('\n');

  const feat: string[] = [];
  if (cls) feat.push(cls.label + ' \u2014 ' + cls.desc);
  if (race) feat.push(next.race + ' traits: ' + race.traits.join(', '));
  if (!cls && next.cls) feat.push(next.cls + ' \u2014 campaign database class');
  if (!race && next.race) feat.push(next.race + ' traits are defined by campaign content');
  if (bg) feat.push(bg.label + ' \u2014 ' + bg.desc);
  const cantrips = c.spells.cantrips || [];
  const known = c.spells.known || [];
  if (cantrips.length || known.length) {
    feat.push('');
    if (cantrips.length) feat.push('Cantrips: ' + cantrips.join(', '));
    if (known.length) feat.push('Spells: ' + known.join(', '));
  }
  if (bg) next.background = bg.label;
  next.features = feat.join('\n');
  return next;
}

// ── Per-step validation ────────────────────────────────────
export function validate(id: StepId, c: WizardChar): boolean {
  switch (id) {
    case 'basics':
      return c.name.trim().length > 0;
    case 'race': {
      const r = raceByKey(c.raceKey);
      if (!r) return !!c.raceKey;
      if (r.subraces.length && !c.subraceKey) return false;
      return true;
    }
    case 'class':
      return !!c.classKey;
    case 'abilities': {
      const allAssigned = ABILITIES.every((a) => (c.baseScores[a.key] || 0) > 0);
      if (!allAssigned) return false;
      if (c.scoreMethod === 'pointbuy') return pointBuySpent(c.baseScores) <= POINT_BUY_BUDGET;
      return true;
    }
    case 'background': {
      const cls = classByKey(c.classKey);
      if (!c.backgroundKey) return false;
      if (cls && (c.classSkills || []).length !== cls.skillCount) return false;
      return true;
    }
    case 'spells': {
      const lim = spellLimits(classByKey(c.classKey), c.level);
      return (c.spells.cantrips || []).length === lim.cantrips && (c.spells.known || []).length === lim.spells;
    }
    default:
      return true;
  }
}

export function requirementHint(id: StepId, c: WizardChar): string {
  switch (id) {
    case 'basics':
      return 'Enter a character name to continue';
    case 'race': {
      const r = raceByKey(c.raceKey);
      if (!r) return 'Choose a race';
      if (r.subraces.length && !c.subraceKey) return 'Choose a subrace';
      return '';
    }
    case 'class':
      return 'Choose a class';
    case 'abilities': {
      if (!ABILITIES.every((a) => (c.baseScores[a.key] || 0) > 0)) return 'Assign all six ability scores';
      if (c.scoreMethod === 'pointbuy' && pointBuySpent(c.baseScores) > POINT_BUY_BUDGET) return 'You are over the 27-point budget';
      return '';
    }
    case 'background': {
      const cls = classByKey(c.classKey);
      if (!c.backgroundKey) return 'Choose a background';
      if (cls) return 'Choose ' + cls.skillCount + ' class skills (' + (c.classSkills || []).length + '/' + cls.skillCount + ')';
      return '';
    }
    case 'spells': {
      const lim = spellLimits(classByKey(c.classKey), c.level);
      return 'Choose ' + lim.cantrips + ' cantrips & ' + lim.spells + ' spells';
    }
    default:
      return '';
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
export interface WizardActions {
  patch: (patch: Partial<WizardChar>) => void;
  setLevel: (n: number) => void;
  setRace: (key: string, label?: string) => void;
  setSubrace: (key: string) => void;
  setClass: (key: string, label?: string) => void;
  setMethod: (m: ScoreMethod) => void;
  setBaseScore: (abil: AbilityKey, val: number) => void;
  rollPool: () => void;
  setBackground: (key: string, label?: string, bgSkills?: string[]) => void;
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
    setRace: (key, label) => {
      const local = raceByKey(key);
      setC(recompute({ ...c, raceKey: key, subraceKey: '', race: local?.label ?? label ?? c.race }));
    },
    setSubrace: (key) => derivePatch({ subraceKey: key }),
    setClass: (key, label) => {
      const local = classByKey(key);
      setC(recompute({
        ...c,
        classKey: key,
        cls: local?.label ?? label ?? c.cls,
        hitDiceType: local ? c.hitDiceType : 'd8',
        classSkills: [],
        spells: { cantrips: [], known: [] },
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
    setBackground: (key, label, dbBgSkills) => {
      const bg = bgByKey(key);
      const bgSkills = bg ? bg.skills : (dbBgSkills || []);
      const classSkills = (c.classSkills || []).filter((s) => !bgSkills.includes(s));
      setC(recompute({ ...c, backgroundKey: key, background: bg?.label ?? label ?? c.background, bgSkills, classSkills }));
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
