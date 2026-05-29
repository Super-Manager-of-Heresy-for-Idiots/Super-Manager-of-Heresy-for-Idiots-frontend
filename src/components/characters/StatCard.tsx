import { formatModifier } from '@/lib/utils';
import type { CharacterStatResponse } from '@/types';

interface StatCardProps {
  stat: CharacterStatResponse;
  onClick?: () => void;
}

export function StatCard({ stat, onClick }: StatCardProps) {
  const displayValue = stat.effectiveValue ?? stat.value;
  const hasModifiers = stat.effectiveValue != null && stat.effectiveValue !== stat.value;

  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center p-4 rounded-lg border border-gold/30 bg-card hover:border-gold/60 hover:bg-gold/5 transition-all cursor-pointer min-w-[100px]"
    >
      <span className="text-xs font-heading font-semibold text-gold uppercase tracking-wider mb-1">
        {stat.statTypeName.length > 3 ? stat.statTypeName.slice(0, 3).toUpperCase() : stat.statTypeName.toUpperCase()}
      </span>
      <span className={`text-3xl font-bold font-heading ${hasModifiers ? (stat.effectiveValue! > stat.value ? 'text-green-400' : 'text-red-400') : ''}`}>
        {displayValue}
      </span>
      {hasModifiers && (
        <span className="text-xs text-muted-foreground">base {stat.value}</span>
      )}
      <span className="text-sm text-muted-foreground mt-1">
        {formatModifier(displayValue)}
      </span>
    </button>
  );
}
