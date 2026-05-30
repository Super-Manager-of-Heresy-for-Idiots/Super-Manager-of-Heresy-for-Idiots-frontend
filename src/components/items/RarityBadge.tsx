import { Rune } from '@/components/ordo';

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

const RARITY_LABEL: Record<string, string> = {
  COMMON: 'Common',
  UNCOMMON: 'Uncommon',
  RARE: 'Rare',
  VERY_RARE: 'Very Rare',
  LEGENDARY: 'Legendary',
};

/* ── Component ─────────────────────────────────────────────────── */

interface RarityBadgeProps {
  rarity: string;
  size?: 'sm' | 'md';
}

export function RarityBadge({ rarity, size = 'sm' }: RarityBadgeProps) {
  const color = RARITY_HUE[rarity] ?? RARITY_HUE.COMMON;
  const glyph = RARITY_GLYPH[rarity] ?? RARITY_GLYPH.COMMON;
  const label = RARITY_LABEL[rarity] ?? rarity;
  const isLegendary = rarity === 'LEGENDARY';

  const fontSize = size === 'md' ? 10 : 9;
  const iconSize = size === 'md' ? 10 : 8;
  const py = size === 'md' ? 3 : 2;
  const px = size === 'md' ? 9 : 7;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: `${py}px ${px}px ${py}px ${px - 1}px`,
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${color}`,
        borderLeft: `2px solid ${color}`,
        fontFamily: 'var(--font-display)',
        fontSize,
        letterSpacing: '0.2em',
        color,
        textTransform: 'uppercase',
        boxShadow: isLegendary
          ? `0 0 10px ${color}55, inset 0 0 8px ${color}22`
          : 'none',
      }}
    >
      <Rune kind={glyph} size={iconSize} color={color} />
      {label}
    </span>
  );
}

export { RARITY_HUE, RARITY_GLYPH, RARITY_LABEL };
