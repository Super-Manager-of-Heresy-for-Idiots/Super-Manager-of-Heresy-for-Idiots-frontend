import { useCallback } from 'react';
import { useI18n } from './I18nContext';

/**
 * Localisation for standard D&D data values that arrive from the backend in
 * English (ability names, sizes, movement types, alignments). These are a
 * bounded, well-known set; anything not found falls back to the original
 * string unchanged (so homebrew / custom content is left as-authored).
 */

/** Full ability names → Russian. Keys are lower-cased. */
const ABILITY_RU: Record<string, string> = {
  strength: 'Сила',
  dexterity: 'Ловкость',
  constitution: 'Телосложение',
  intelligence: 'Интеллект',
  wisdom: 'Мудрость',
  charisma: 'Харизма',
};

/** Three-letter ability abbreviations → Russian. Keys are the canonical en abbr (lower-cased). */
const ABILITY_ABBR_RU: Record<string, string> = {
  str: 'СИЛ',
  dex: 'ЛОВ',
  con: 'ТЕЛ',
  int: 'ИНТ',
  wis: 'МУД',
  cha: 'ХАР',
};

/** Canonical English abbreviations keyed by the canonical key. */
const ABILITY_ABBR_EN: Record<string, string> = {
  str: 'STR',
  dex: 'DEX',
  con: 'CON',
  int: 'INT',
  wis: 'WIS',
  cha: 'CHA',
};

/** Resolve a full ability name or abbreviation to its canonical key, or null. */
function abilityKey(value: string): string | null {
  const lower = value.trim().toLowerCase();
  const byFull: Record<string, string> = {
    strength: 'str',
    dexterity: 'dex',
    constitution: 'con',
    intelligence: 'int',
    wisdom: 'wis',
    charisma: 'cha',
  };
  if (byFull[lower]) return byFull[lower];
  if (ABILITY_ABBR_EN[lower]) return lower;
  return null;
}

/** Creature sizes → Russian. Keys are lower-cased. */
const SIZE_RU: Record<string, string> = {
  tiny: 'Крошечный',
  small: 'Маленький',
  medium: 'Средний',
  large: 'Большой',
  huge: 'Огромный',
  gargantuan: 'Громадный',
};

/** Movement types → Russian. Keys are lower-cased. */
const MOVEMENT_RU: Record<string, string> = {
  walk: 'ходьба',
  walking: 'ходьба',
  fly: 'полёт',
  flying: 'полёт',
  swim: 'плавание',
  swimming: 'плавание',
  climb: 'лазание',
  climbing: 'лазание',
  burrow: 'копание',
  burrowing: 'копание',
  hover: 'парение',
};

/** Standard skills → Russian. Keys are lower-cased full names. */
const SKILL_RU: Record<string, string> = {
  athletics: 'Атлетика',
  acrobatics: 'Акробатика',
  'sleight of hand': 'Ловкость рук',
  stealth: 'Скрытность',
  arcana: 'Магия',
  history: 'История',
  investigation: 'Анализ',
  nature: 'Природа',
  religion: 'Религия',
  'animal handling': 'Уход за животными',
  insight: 'Проницательность',
  medicine: 'Медицина',
  perception: 'Внимательность',
  survival: 'Выживание',
  deception: 'Обман',
  intimidation: 'Запугивание',
  performance: 'Выступление',
  persuasion: 'Убеждение',
};

/** Alignments → Russian. Keys are lower-cased. */
const ALIGNMENT_RU: Record<string, string> = {
  'lawful good': 'Законопослушный добрый',
  'neutral good': 'Нейтральный добрый',
  'chaotic good': 'Хаотичный добрый',
  'lawful neutral': 'Законопослушный нейтральный',
  'true neutral': 'Истинно нейтральный',
  neutral: 'Нейтральный',
  'chaotic neutral': 'Хаотичный нейтральный',
  'lawful evil': 'Законопослушный злой',
  'neutral evil': 'Нейтральный злой',
  'chaotic evil': 'Хаотичный злой',
};

function lookup(map: Record<string, string>, value: string): string {
  return map[value.trim().toLowerCase()] ?? value;
}

/**
 * Hook returning helpers that translate standard game-data terms to the active
 * language. In English mode the original value is returned untouched.
 */
export function useGameTerms() {
  const { lang } = useI18n();

  const ability = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      return lang === 'en' ? value : lookup(ABILITY_RU, value);
    },
    [lang],
  );

  const abilityAbbr = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      const key = abilityKey(value);
      if (!key) return value; // unknown / homebrew stat — leave untouched
      return lang === 'en' ? ABILITY_ABBR_EN[key] : ABILITY_ABBR_RU[key];
    },
    [lang],
  );

  const size = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      if (lang === 'en') {
        return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
      }
      return lookup(SIZE_RU, value);
    },
    [lang],
  );

  const movement = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      return lang === 'en' ? value : lookup(MOVEMENT_RU, value);
    },
    [lang],
  );

  const alignment = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      return lang === 'en' ? value : lookup(ALIGNMENT_RU, value);
    },
    [lang],
  );

  const skill = useCallback(
    (value: string | null | undefined): string => {
      if (!value) return value ?? '';
      return lang === 'en' ? value : lookup(SKILL_RU, value);
    },
    [lang],
  );

  return { ability, abilityAbbr, size, movement, alignment, skill };
}
