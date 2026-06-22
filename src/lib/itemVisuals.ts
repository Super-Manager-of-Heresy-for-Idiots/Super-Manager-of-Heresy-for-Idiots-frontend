import type { ItemInstanceResponse } from '@/types';

/* ── Rarity normalization ──────────────────────────────────────────
   Backend returns rarity as a slug (`very-rare`, `artifact`, …), but
   older payloads/code use UPPER_SNAKE (`VERY_RARE`). Fold both forms
   into one canonical key so visuals never silently fall back to gray. */

export type RarityKey =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'very-rare'
  | 'legendary'
  | 'artifact';

export const RARITY_ORDER: RarityKey[] = [
  'common',
  'uncommon',
  'rare',
  'very-rare',
  'legendary',
  'artifact',
];

export function normalizeRarity(raw?: string | null): RarityKey | undefined {
  if (!raw) return undefined;
  const key = raw.trim().toLowerCase().replace(/[\s_]+/g, '-');
  switch (key) {
    case 'common':
    case 'uncommon':
    case 'rare':
    case 'very-rare':
    case 'legendary':
    case 'artifact':
      return key;
    default:
      return undefined;
  }
}

const RARITY_COLOR_VAR: Record<RarityKey, string> = {
  common: 'var(--rar-common)',
  uncommon: 'var(--rar-uncommon)',
  rare: 'var(--rar-rare)',
  'very-rare': 'var(--rar-very-rare)',
  legendary: 'var(--rar-legendary)',
  artifact: 'var(--rar-artifact)',
};

export function rarityColor(rarity?: string): string {
  const key = normalizeRarity(rarity);
  return key ? RARITY_COLOR_VAR[key] : 'var(--ink-quiet)';
}

const RARITY_SLOT_CLASS: Record<RarityKey, string> = {
  common: 'ao-slot',
  uncommon: 'ao-slot ao-slot--cursed',
  rare: 'ao-slot ao-slot--rare',
  'very-rare': 'ao-slot ao-slot--epic',
  legendary: 'ao-slot ao-slot--epic',
  artifact: 'ao-slot ao-slot--epic',
};

export function slotClass(rarity?: string): string {
  const key = normalizeRarity(rarity);
  return key ? RARITY_SLOT_CLASS[key] : 'ao-slot';
}

export const SLOT_GLYPH: Record<string, string> = {
  HEAD: 'helm',
  NECK: 'cir-dot',
  CLOAK: 'shield',
  CHEST: 'shield',
  MAIN_HAND: 'sword',
  OFF_HAND: 'shield',
  RING_LEFT: 'cir',
  RING_RIGHT: 'cir',
  LEGS: 'square',
  FEET: 'tri-inv',
};

export function itemGlyph(item: ItemInstanceResponse): string {
  if (item.slot && SLOT_GLYPH[item.slot]) return SLOT_GLYPH[item.slot];
  if (item.isUnique || item.artifactName) return 'diamond';
  return 'scroll';
}
