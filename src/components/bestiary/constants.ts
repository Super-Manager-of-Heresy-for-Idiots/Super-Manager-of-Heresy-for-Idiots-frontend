import type { AbilityEnum, CreatureSize, DamageType, DictionaryKind, MonsterScope } from '@/types';

// === Enums hardcoded per contract §0.5 (UPPERCASE value + RU label) ===

export const SIZE_OPTIONS: { v: CreatureSize; label: string }[] = [
  { v: 'TINY', label: 'Крошечный' },
  { v: 'SMALL', label: 'Маленький' },
  { v: 'MEDIUM', label: 'Средний' },
  { v: 'LARGE', label: 'Большой' },
  { v: 'HUGE', label: 'Огромный' },
  { v: 'GARGANTUAN', label: 'Громадный' },
];

export const SIZE_RU: Record<CreatureSize, string> = {
  TINY: 'Крошечный', SMALL: 'Маленький', MEDIUM: 'Средний',
  LARGE: 'Большой', HUGE: 'Огромный', GARGANTUAN: 'Громадный',
};

export const ABILITY_OPTIONS: { v: AbilityEnum; label: string }[] = [
  { v: 'STRENGTH', label: 'Сила' },
  { v: 'DEXTERITY', label: 'Ловкость' },
  { v: 'CONSTITUTION', label: 'Телосложение' },
  { v: 'INTELLIGENCE', label: 'Интеллект' },
  { v: 'WISDOM', label: 'Мудрость' },
  { v: 'CHARISMA', label: 'Харизма' },
];

export const ABILITY_RU: Record<AbilityEnum, string> = {
  STRENGTH: 'Сила', DEXTERITY: 'Ловкость', CONSTITUTION: 'Телосложение',
  INTELLIGENCE: 'Интеллект', WISDOM: 'Мудрость', CHARISMA: 'Харизма',
};

export const ABILITY_SCORE_FIELDS: { key: 'strScore' | 'dexScore' | 'conScore' | 'intScore' | 'wisScore' | 'chaScore'; label: string; full: AbilityEnum }[] = [
  { key: 'strScore', label: 'СИЛ', full: 'STRENGTH' },
  { key: 'dexScore', label: 'ЛВК', full: 'DEXTERITY' },
  { key: 'conScore', label: 'ТЕЛ', full: 'CONSTITUTION' },
  { key: 'intScore', label: 'ИНТ', full: 'INTELLIGENCE' },
  { key: 'wisScore', label: 'МДР', full: 'WISDOM' },
  { key: 'chaScore', label: 'ХАР', full: 'CHARISMA' },
];

export const DAMAGE_TYPE_OPTIONS: { v: DamageType; label: string }[] = [
  { v: 'SLASHING', label: 'Рубящий' },
  { v: 'PIERCING', label: 'Колющий' },
  { v: 'BLUDGEONING', label: 'Дробящий' },
  { v: 'FIRE', label: 'Огонь' },
  { v: 'COLD', label: 'Холод' },
  { v: 'LIGHTNING', label: 'Молния' },
  { v: 'POISON', label: 'Яд' },
  { v: 'NECROTIC', label: 'Некротический' },
  { v: 'RADIANT', label: 'Излучение' },
  { v: 'PSYCHIC', label: 'Психический' },
  { v: 'FORCE', label: 'Силовое поле' },
  { v: 'THUNDER', label: 'Звук' },
  { v: 'ACID', label: 'Кислота' },
];

export const DAMAGE_TYPE_RU: Record<DamageType, string> = {
  SLASHING: 'рубящий', PIERCING: 'колющий', BLUDGEONING: 'дробящий',
  FIRE: 'огонь', COLD: 'холод', LIGHTNING: 'молния', POISON: 'яд',
  NECROTIC: 'некротический', RADIANT: 'излучение', PSYCHIC: 'психический',
  FORCE: 'силовое поле', THUNDER: 'звук', ACID: 'кислота',
};

// `section` / `kind` are free strings; these are presets/labels only.
export const SECTION_PRESETS = ['traits', 'actions', 'bonus_actions', 'reactions', 'legendary_actions'];
export const SECTION_RU: Record<string, string> = {
  traits: 'Особенности', actions: 'Действия', bonus_actions: 'Бонусные действия',
  reactions: 'Реакции', legendary_actions: 'Легендарные действия',
};
export const SECTION_ORDER = ['traits', 'actions', 'bonus_actions', 'reactions', 'legendary_actions'];

export const SCOPE_RU: Record<MonsterScope, string> = {
  SYSTEM: 'Системный', HOMEBREW: 'Homebrew', CAMPAIGN: 'Кампания',
};

// === Dictionaries (§0.6) ===

export const DICTIONARY_KINDS: DictionaryKind[] = [
  'creature-types', 'alignments', 'languages', 'sense-types', 'movement-types',
  'habitats', 'treasure-tags', 'conditions', 'gear-items', 'sources',
];

export const DICTIONARY_META: { slug: DictionaryKind; label: string; sub: string }[] = [
  { slug: 'creature-types', label: 'Типы существ', sub: 'гуманоид, дракон…' },
  { slug: 'alignments', label: 'Мировоззрения', sub: 'законопослушный…' },
  { slug: 'languages', label: 'Языки', sub: 'общий, драконий…' },
  { slug: 'sense-types', label: 'Типы чувств', sub: 'тёмное зрение…' },
  { slug: 'movement-types', label: 'Типы перемещения', sub: 'ходьба, полёт…' },
  { slug: 'habitats', label: 'Места обитания', sub: 'лес, горы…' },
  { slug: 'treasure-tags', label: 'Теги сокровищ', sub: 'клад, индивид.…' },
  { slug: 'conditions', label: 'Состояния', sub: 'для иммунитетов' },
  { slug: 'gear-items', label: 'Снаряжение', sub: 'оружие монстров' },
  { slug: 'sources', label: 'Источники', sub: 'книги · bookCode' },
];
