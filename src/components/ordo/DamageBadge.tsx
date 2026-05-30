import { Rune } from './Rune';

interface DamageBadgeProps {
  dice: string;
  type: string;
  bonus?: number;
}

export function DamageBadge({ dice, type, bonus }: DamageBadgeProps) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '5px 10px',
        background: 'var(--abyss)',
        border: '1px solid var(--rule-strong)',
        fontFamily: 'var(--font-mono)',
        fontSize: 12,
        color: 'var(--ink-bright)',
      }}
    >
      <Rune kind="sword" size={11} color="var(--ink-quiet)" />
      <span>{dice}{bonus ? `+${bonus}` : ''}</span>
      <span style={{ color: 'var(--ink-faint)', textTransform: 'lowercase' }}>{type}</span>
    </span>
  );
}
