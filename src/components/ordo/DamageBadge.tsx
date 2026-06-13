import { Rune } from './Rune';

interface DamageBadgeProps {
  dice: string;
  type: string;
  bonus?: number;
}

export function DamageBadge({ dice, type, bonus }: DamageBadgeProps) {
  return (
    <span className="ao-dmgbadge">
      <Rune kind="sword" size={11} color="var(--ink-quiet)" />
      <span>{dice}{bonus ? `+${bonus}` : ''}</span>
      <span className="ao-dmgbadge-type">{type}</span>
    </span>
  );
}
