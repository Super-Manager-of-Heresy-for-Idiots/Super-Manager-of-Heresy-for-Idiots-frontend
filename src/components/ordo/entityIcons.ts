import type { OrdoInterfaceIconKey } from './OrdoInterfaceIcon';

const GLYPH_ENTITY_ICON: Record<string, OrdoInterfaceIconKey> = {
  helm: 'campaign',
  shield: 'character',
  scroll: 'session-note',
  sword: 'weapon',
  book: 'dictionary',
  coin: 'wallet',
  flame: 'active-effect',
  eye: 'visible',
  lock: 'locked',
  hex: 'resource',
  'sigil-1': 'npc',
  'sigil-2': 'campaign-blueprint',
  'sigil-3': 'location',
  'cross-pat': 'validation-error',
  'tri-inv': 'validation-warning',
  diamond: 'feature-rule',
  'diamond-fill': 'feature-rule',
};

const DAMAGE_TYPE_ICON: Record<string, OrdoInterfaceIconKey> = {
  acid: 'damage-acid',
  bludgeoning: 'damage-bludgeoning',
  cold: 'damage-cold',
  fire: 'damage-fire',
  force: 'damage-force',
  lightning: 'damage-lightning',
  necrotic: 'damage-necrotic',
  piercing: 'damage-piercing',
  poison: 'damage-poison',
  psychic: 'damage-psychic',
  radiant: 'damage-radiant',
  slashing: 'damage-slashing',
  thunder: 'damage-thunder',
};

const RARITY_ICON: Record<string, OrdoInterfaceIconKey> = {
  common: 'rarity-common',
  uncommon: 'rarity-uncommon',
  rare: 'rarity-rare',
  'very-rare': 'rarity-very-rare',
  legendary: 'rarity-legendary',
  artifact: 'rarity-legendary',
};

const EQUIPMENT_SLOT_ICON: Record<string, OrdoInterfaceIconKey> = {
  HEAD: 'slot-head',
  CHEST: 'slot-chest',
  LEGS: 'slot-legs',
  FEET: 'slot-feet',
  MAIN_HAND: 'slot-main-hand',
  OFF_HAND: 'slot-off-hand',
  RING_LEFT: 'slot-ring',
  RING_RIGHT: 'slot-ring',
  NECK: 'slot-neck',
  CLOAK: 'slot-cloak',
};

const GRANT_ICON: Record<string, OrdoInterfaceIconKey> = {
  FEATURE: 'grant-feature',
  SUBCLASS: 'grant-subclass',
  FEAT: 'grant-feat',
  SPELL: 'grant-spell',
  SKILL: 'grant-skill',
  ABILITY: 'grant-ability',
  MODIFIER: 'grant-modifier',
  CUSTOM: 'grant-custom',
  UNKNOWN: 'grant-unknown',
};

const ABILITY_ICON: Record<string, OrdoInterfaceIconKey> = {
  STR: 'strength',
  STRENGTH: 'strength',
  DEX: 'dexterity',
  DEXTERITY: 'dexterity',
  CON: 'constitution',
  CONSTITUTION: 'constitution',
  INT: 'intelligence',
  INTELLIGENCE: 'intelligence',
  WIS: 'wisdom',
  WISDOM: 'wisdom',
  CHA: 'charisma',
  CHARISMA: 'charisma',
};

export function entityIconForGlyph(glyph: string | null | undefined): OrdoInterfaceIconKey | null {
  if (!glyph) return null;
  return GLYPH_ENTITY_ICON[glyph] ?? null;
}

export function damageIconForType(type: string | null | undefined): OrdoInterfaceIconKey {
  const normalized = (type ?? '').trim().toLowerCase();
  return DAMAGE_TYPE_ICON[normalized] ?? 'damage';
}

export function rarityIconForKey(key: string | null | undefined): OrdoInterfaceIconKey {
  const normalized = (key ?? '').trim().toLowerCase().replace(/[\s_]+/g, '-');
  return RARITY_ICON[normalized] ?? 'rarity-common';
}

export function equipmentSlotIconForSlot(slot: string | null | undefined): OrdoInterfaceIconKey {
  if (!slot) return 'item';
  return EQUIPMENT_SLOT_ICON[slot] ?? 'item-equipped';
}

export function itemIconForInstance(item: {
  slot?: string | null;
  isUnique?: boolean | null;
  artifactName?: string | null;
}): OrdoInterfaceIconKey {
  if (item.slot) return equipmentSlotIconForSlot(item.slot);
  if (item.isUnique || item.artifactName) return 'magic-item';
  return 'item-instance';
}

export function grantIconForKind(kind: string | null | undefined): OrdoInterfaceIconKey {
  if (!kind) return 'grant-unknown';
  return GRANT_ICON[kind] ?? 'grant-unknown';
}

export function abilityIconForCode(code: string | null | undefined): OrdoInterfaceIconKey {
  if (!code) return 'ability-check';
  return ABILITY_ICON[code.trim().toUpperCase()] ?? 'ability-check';
}

export function spellLevelIcon(level: number | null | undefined): OrdoInterfaceIconKey {
  if (level == null || level <= 0) return 'spell-cantrip';
  if (level >= 1 && level <= 9) return `spell-level-${level}`;
  return 'spell';
}
