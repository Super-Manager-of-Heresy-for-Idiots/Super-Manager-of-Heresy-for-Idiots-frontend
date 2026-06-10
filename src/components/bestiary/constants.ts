import type { AbilityEnum, CreatureSize, DamageType, DictionaryKind, MonsterScope } from '@/types';

/** Translate function signature (matches useT). */
export type TFunc = (key: string, vars?: Record<string, string | number>) => string;

// === Enum values (UPPERCASE per contract §0.5) ===
export const SIZE_VALUES: CreatureSize[] = ['TINY', 'SMALL', 'MEDIUM', 'LARGE', 'HUGE', 'GARGANTUAN'];
export const ABILITY_VALUES: AbilityEnum[] = ['STRENGTH', 'DEXTERITY', 'CONSTITUTION', 'INTELLIGENCE', 'WISDOM', 'CHARISMA'];
export const DAMAGE_TYPE_VALUES: DamageType[] = [
  'SLASHING', 'PIERCING', 'BLUDGEONING', 'FIRE', 'COLD', 'LIGHTNING', 'POISON',
  'NECROTIC', 'RADIANT', 'PSYCHIC', 'FORCE', 'THUNDER', 'ACID',
];

// `section` / `kind` are free strings; these are presets only.
export const SECTION_PRESETS = ['traits', 'actions', 'bonus_actions', 'reactions', 'legendary_actions'];
export const SECTION_ORDER = ['traits', 'actions', 'bonus_actions', 'reactions', 'legendary_actions'];

export const ABILITY_SCORE_FIELDS: { key: 'strScore' | 'dexScore' | 'conScore' | 'intScore' | 'wisScore' | 'chaScore'; full: AbilityEnum }[] = [
  { key: 'strScore', full: 'STRENGTH' },
  { key: 'dexScore', full: 'DEXTERITY' },
  { key: 'conScore', full: 'CONSTITUTION' },
  { key: 'intScore', full: 'INTELLIGENCE' },
  { key: 'wisScore', full: 'WISDOM' },
  { key: 'chaScore', full: 'CHARISMA' },
];

// === Dictionary kinds (§0.6) ===
export const DICTIONARY_KINDS: DictionaryKind[] = [
  'creature-types', 'alignments', 'languages', 'sense-types', 'movement-types',
  'habitats', 'treasure-tags', 'conditions', 'gear-items', 'sources',
];

// === i18n key helpers ===
export const sizeKey = (s: CreatureSize) => `best.size.${s}`;
export const abilityKey = (a: AbilityEnum) => `best.ability.${a}`;
export const abilityShortKey = (a: AbilityEnum) => `best.abilShort.${a}`;
export const damageKey = (d: DamageType) => `best.dmg.${d}`;
export const sectionKey = (s: string) => `best.section.${s}`;
export const scopeKey = (sc: MonsterScope) => `best.scope.${sc}`;
export const dictLabelKey = (k: DictionaryKind) => `best.dict.${k}.label`;
export const dictSubKey = (k: DictionaryKind) => `best.dict.${k}.sub`;

// === Localised select option builders ===
export const sizeOptions = (t: TFunc) => SIZE_VALUES.map((v) => ({ v, label: t(sizeKey(v)) }));
export const abilityOptions = (t: TFunc) => ABILITY_VALUES.map((v) => ({ v, label: t(abilityKey(v)) }));
export const damageTypeOptions = (t: TFunc) => DAMAGE_TYPE_VALUES.map((v) => ({ v, label: t(damageKey(v)) }));
