import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { normalizeRarity, type RarityKey } from '@/lib/itemVisuals';
import s from './RarityBadge.module.css';

/* ── Rarity colour & glyph maps (canonical lowercase keys) ────────── */

const RARITY_HUE: Record<RarityKey, string> = {
  common: 'var(--rar-common)',
  uncommon: 'var(--rar-uncommon)',
  rare: 'var(--rar-rare)',
  'very-rare': 'var(--rar-very-rare)',
  legendary: 'var(--rar-legendary)',
  artifact: 'var(--rar-artifact)',
};

const RARITY_GLYPH: Record<RarityKey, string> = {
  common: 'square',
  uncommon: 'tri',
  rare: 'diamond',
  'very-rare': 'hex',
  legendary: 'sigil-2',
  artifact: 'sigil-1',
};

const RARITY_LABEL_KEY: Record<RarityKey, string> = {
  common: 'cmp.rarity.COMMON',
  uncommon: 'cmp.rarity.UNCOMMON',
  rare: 'cmp.rarity.RARE',
  'very-rare': 'cmp.rarity.VERY_RARE',
  legendary: 'cmp.rarity.LEGENDARY',
  artifact: 'cmp.rarity.ARTIFACT',
};

/** Rarity colour (CSS token) for any backend rarity form. */
export function rarityHue(raw?: string | null): string {
  const key = normalizeRarity(raw);
  return key ? RARITY_HUE[key] : RARITY_HUE.common;
}

/** i18n key for a rarity's label, for any backend rarity form. */
export function rarityLabelKey(raw?: string | null): string {
  const key = normalizeRarity(raw) ?? 'common';
  return RARITY_LABEL_KEY[key];
}

/* ── Component ─────────────────────────────────────────────────────── */

interface RarityBadgeProps {
  rarity: string;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const t = useT();
  const key = normalizeRarity(rarity) ?? 'common';
  const color = RARITY_HUE[key];
  const glyph = RARITY_GLYPH[key];
  const label = t(RARITY_LABEL_KEY[key]);
  const isLegendary = key === 'legendary' || key === 'artifact';
  const iconSize = size === 'md' ? 10 : 8;

  return (
    <span
      className={cn(s.badge, size === 'md' && s.md, isLegendary && s.legendary)}
      style={{ '--rar': color } as CSSProperties}
    >
      <Rune kind={glyph} size={iconSize} color={color} />
      {label}
    </span>
  );
}

export { RARITY_HUE, RARITY_GLYPH, RARITY_LABEL_KEY };
