import { OrdoInterfaceIcon } from './OrdoInterfaceIcon';
import { damageIconForType } from './entityIcons';

interface DamageBadgeProps {
  dice: string;
  type: string;
  bonus?: number;
}

export function DamageBadge({ dice, type, bonus }: DamageBadgeProps) {
  return (
    <span className="ao-dmgbadge">
      <OrdoInterfaceIcon icon={damageIconForType(type)} size={12} style={{ color: 'var(--ink-quiet)' }} />
      <span>{dice}{bonus ? `+${bonus}` : ''}</span>
      <span className="ao-dmgbadge-type">{type}</span>
    </span>
  );
}
