import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './RarityBadge.module.css';

/* ── Rarity colour & glyph maps ───────────────────────────────── */

const RARITY_HUE: Record<string, string> = {
  COMMON: '#968c75',
  UNCOMMON: '#7a9866',
  RARE: '#6f93c4',
  VERY_RARE: '#9a7ec0',
  LEGENDARY: '#d4b478',
};

const RARITY_GLYPH: Record<string, string> = {
  COMMON: 'square',
  UNCOMMON: 'tri',
  RARE: 'diamond',
  VERY_RARE: 'hex',
  LEGENDARY: 'sigil-2',
};

const RARITY_LABEL_KEY: Record<string, string> = {
  COMMON: 'cmp.rarity.COMMON',
  UNCOMMON: 'cmp.rarity.UNCOMMON',
  RARE: 'cmp.rarity.RARE',
  VERY_RARE: 'cmp.rarity.VERY_RARE',
  LEGENDARY: 'cmp.rarity.LEGENDARY',
};

/* ── Component ─────────────────────────────────────────────────── */

interface RarityBadgeProps {
  rarity: string;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const t = useT();
  const color = RARITY_HUE[rarity] ?? RARITY_HUE.COMMON;
  const glyph = RARITY_GLYPH[rarity] ?? RARITY_GLYPH.COMMON;
  const labelKey = RARITY_LABEL_KEY[rarity];
  const label = labelKey ? t(labelKey) : rarity;
  const isLegendary = rarity === 'LEGENDARY';
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
