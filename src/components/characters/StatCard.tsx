import { formatModifier } from '@/lib/utils';
import type { CharacterStat } from '@/types';

interface StatCardProps {
  stat: CharacterStat;
  onClick?: () => void;
}

export function StatCard({ stat, onClick }: StatCardProps) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-lg border border-gold/30 bg-card hover:border-gold/60 hover:bg-gold/5 transition-all cursor-pointer min-w-[100px]"
    >
      <span className="text-xs font-heading font-semibold text-gold uppercase tracking-wider mb-1">
        {stat.statType.name.length > 3 ? stat.statType.name.slice(0, 3).toUpperCase() : stat.statType.name.toUpperCase()}
      </span>
      <span className="text-3xl font-bold font-heading">{stat.value}</span>
      <span className="text-sm text-muted-foreground mt-1">
        {formatModifier(stat.value)}
      </span>
    </button>
  );
}
