// ============================================================
// D&D 5e math helpers + fixed enums for the Character Wizard.
// Content data (races, classes, backgrounds, spells) now comes
// from the backend reference APIs — only game rules / math and
// the fixed ability/skill/alignment enums live here.
// Pure data + functions — no DOM, no globals.
// ============================================================

export type AbilityKey = 'str' | 'dex' | 'con' | 'int' | 'wis' | 'cha';

export interface AbilityDef {
  key: AbilityKey;
  label: string;
  abbr: string;
}

export interface SkillDef {
  key: string;
  label: string;
  abil: AbilityKey;
}

export type ASI = Partial<Record<AbilityKey, number>>;

// ── 5e math ────────────────────────────────────────────────
export const abilityMod = (score: number): number =>
  Math.floor((Number(score || 0) - 10) / 2);
export const fmtMod = (n: number): string => (n >= 0 ? `+${n}` : `${n}`);
export const profByLevel = (lvl: number): number =>
  Math.ceil(Math.min(20, Math.max(1, Number(lvl || 1))) / 4) + 1;
export const clamp = (n: number, lo: number, hi: number): number =>
  Math.min(hi, Math.max(lo, n));

// ── Abilities ──────────────────────────────────────────────
export const ABILITIES: AbilityDef[] = [
  { key: 'str', label: 'Strength', abbr: 'STR' },
  { key: 'dex', label: 'Dexterity', abbr: 'DEX' },
  { key: 'con', label: 'Constitution', abbr: 'CON' },
  { key: 'int', label: 'Intelligence', abbr: 'INT' },
  { key: 'wis', label: 'Wisdom', abbr: 'WIS' },
  { key: 'cha', label: 'Charisma', abbr: 'CHA' },
];

// ── Skills, grouped by governing ability ───────────────────
export const SKILLS: SkillDef[] = [
  { key: 'athletics', label: 'Athletics', abil: 'str' },
  { key: 'acrobatics', label: 'Acrobatics', abil: 'dex' },
  { key: 'sleight', label: 'Sleight of Hand', abil: 'dex' },
  { key: 'stealth', label: 'Stealth', abil: 'dex' },
  { key: 'arcana', label: 'Arcana', abil: 'int' },
  { key: 'history', label: 'History', abil: 'int' },
  { key: 'investigation', label: 'Investigation', abil: 'int' },
  { key: 'nature', label: 'Nature', abil: 'int' },
  { key: 'religion', label: 'Religion', abil: 'int' },
  { key: 'animal', label: 'Animal Handling', abil: 'wis' },
  { key: 'insight', label: 'Insight', abil: 'wis' },
  { key: 'medicine', label: 'Medicine', abil: 'wis' },
  { key: 'perception', label: 'Perception', abil: 'wis' },
  { key: 'survival', label: 'Survival', abil: 'wis' },
  { key: 'deception', label: 'Deception', abil: 'cha' },
  { key: 'intimidation', label: 'Intimidation', abil: 'cha' },
  { key: 'performance', label: 'Performance', abil: 'cha' },
  { key: 'persuasion', label: 'Persuasion', abil: 'cha' },
];

export const ALIGNMENTS: string[] = [
  'Lawful Good', 'Neutral Good', 'Chaotic Good',
  'Lawful Neutral', 'True Neutral', 'Chaotic Neutral',
  'Lawful Evil', 'Neutral Evil', 'Chaotic Evil',
];

// ── Ability-score generation ───────────────────────────────
export const STANDARD_ARRAY: number[] = [15, 14, 13, 12, 10, 8];
export const POINT_BUY_COST: Record<number, number> = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
export const POINT_BUY_BUDGET = 27;

export type ScoreMap = Record<AbilityKey, number>;

export const pointBuySpent = (base: ScoreMap): number =>
  ABILITIES.reduce((sum, a) => sum + (POINT_BUY_COST[base[a.key]] ?? 0), 0);

const d6 = (): number => Math.ceil(Math.random() * 6);
export const roll4d6 = (): number => {
  const dice = [d6(), d6(), d6(), d6()].sort((x, y) => x - y);
  return dice[1] + dice[2] + dice[3];
};
export const rollStats = (): number[] =>
  Array.from({ length: 6 }, roll4d6).sort((x, y) => y - x);

// merge racial ASI onto a base score map
export const applyRacial = (base: ScoreMap, asi: ASI): ScoreMap => {
  const out = { ...base };
  ABILITIES.forEach((a) => {
    out[a.key] = Number(base[a.key] || 0) + Number(asi[a.key] || 0);
  });
  return out;
};

// ── ASI from backend race detail ───────────────────────────
const norm = (value: string | undefined): string => (value || '').trim().toLowerCase();

// Canonical Russian ability names. The content-model reference (/reference/stat-types)
// returns getNameRu() ("Сила", "Ловкость", …); older/vanilla data returns the English
// label. Match either, so ability↔stat-type resolution survives the migration.
const STAT_RU_NAME_BY_KEY: Record<AbilityKey, string> = {
  str: 'Сила',
  dex: 'Ловкость',
  con: 'Телосложение',
  int: 'Интеллект',
  wis: 'Мудрость',
  cha: 'Харизма',
};

/** Resolve an ability key from a stat label (backend uses localized stat names). */
export const abilityKeyByStatName = (name: string): AbilityKey | undefined => {
  const n = norm(name);
  if (!n) return undefined;
  return ABILITIES.find(
    (a) => norm(a.label) === n || norm(a.abbr) === n || norm(STAT_RU_NAME_BY_KEY[a.key]) === n,
  )?.key;
};

/** Map backend `{ statName, bonus }[]` to an AbilityKey-keyed ASI via `resolve`. */
export const asiFromDetail = (
  items: { statName: string; bonus: number }[] | undefined,
  resolve: (statName: string) => AbilityKey | undefined,
): ASI => {
  const out: ASI = {};
  (items || []).forEach((it) => {
    const k = resolve(it.statName);
    if (k) out[k] = (out[k] || 0) + Number(it.bonus || 0);
  });
  return out;
};

/** Combine two ASI maps (race + subrace). */
export const mergeAsi = (a: ASI, b?: ASI): ASI => {
  const out: ASI = { ...a };
  (Object.keys(b || {}) as AbilityKey[]).forEach((k) => {
    out[k] = (out[k] || 0) + (b![k] || 0);
  });
  return out;
};

// ── Spell limits (simplified guide, scales with level) ─────
export interface SpellcasterKind {
  isSpellcaster: boolean;
  hasCantrips: boolean;
  isHalfCaster?: boolean;
  /** Class slug / vanilla key (lowercase) — picks the count curve. */
  kind?: string;
}

export function spellLimits(k: SpellcasterKind | null, level: number): { cantrips: number; spells: number } {
  if (!k || !k.isSpellcaster) return { cantrips: 0, spells: 0 };
  const lvl = Math.max(1, Math.min(20, level));
  const cantripsBase: Record<string, number> = { bard: 2, cleric: 3, druid: 2, sorcerer: 4, warlock: 2, wizard: 3 };
  let cantrips = k.hasCantrips ? (cantripsBase[k.kind ?? ''] ?? 2) : 0;
  if (k.hasCantrips && lvl >= 4) cantrips += 1;
  if (k.hasCantrips && lvl >= 10) cantrips += 1;
  let spells: number;
  if (k.isHalfCaster) spells = Math.max(2, Math.floor(lvl / 2) + 1);
  else if (k.kind === 'warlock') spells = Math.min(15, 1 + lvl);
  else if (k.kind === 'wizard') spells = 6 + (lvl - 1) * 2;
  else spells = Math.min(22, 3 + lvl);
  return { cantrips, spells };
}

/**
 * Highest spell level a character can know at this level. Mirrors the backend
 * `ContentCharacterCreationService.getMaxSpellLevel` exactly (`min(cap, (lvl+1)/2)`,
 * cap 5 for half-casters else 9) so the picker never offers a spell the submit-time
 * validation would reject ("Spell (level N) exceeds max spell level M").
 */
export const maxSpellLevel = (isHalfCaster: boolean, level: number): number => {
  const lvl = Math.max(1, Math.min(20, Number(level || 1)));
  return Math.min(isHalfCaster ? 5 : 9, Math.floor((lvl + 1) / 2));
};

export const skillByKey = (k: string): SkillDef | undefined => SKILLS.find((s) => s.key === k);
export const abilityByKey = (k: string): AbilityDef | undefined => ABILITIES.find((a) => a.key === k);
