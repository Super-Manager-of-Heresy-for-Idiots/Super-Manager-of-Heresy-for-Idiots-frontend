import { StatBlock } from '@/components/ao';
import type { CharacterStat } from '@/types';

interface StatCardProps {
  stat: CharacterStat;
  onClick?: () => void;
}

export function StatCard({ stat, onClick }: StatCardProps) {
  const label = stat.statType.name.length > 3
    ? stat.statType.name.slice(0, 3).toUpperCase()
    : stat.statType.name.toUpperCase();

  return (
    <div onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default' }}>
      <StatBlock label={label} value={stat.value} />
    </div>
  );
}
