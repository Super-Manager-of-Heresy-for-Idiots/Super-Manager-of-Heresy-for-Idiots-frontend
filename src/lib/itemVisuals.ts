import type { ItemInstanceResponse } from '@/types';

export function rarityColor(rarity?: string): string {
  switch (rarity) {
    case 'LEGENDARY':
    case 'VERY_RARE':
      return 'var(--gold)';
    case 'RARE':
      return 'var(--arcane)';
    case 'UNCOMMON':
      return 'var(--ember)';
    default:
      return 'var(--ink-quiet)';
  }
}

export function slotClass(rarity?: string): string {
  switch (rarity) {
    case 'LEGENDARY':
    case 'VERY_RARE':
      return 'ao-slot ao-slot--epic';
    case 'RARE':
      return 'ao-slot ao-slot--rare';
    case 'UNCOMMON':
      return 'ao-slot ao-slot--cursed';
    default:
      return 'ao-slot';
  }
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
