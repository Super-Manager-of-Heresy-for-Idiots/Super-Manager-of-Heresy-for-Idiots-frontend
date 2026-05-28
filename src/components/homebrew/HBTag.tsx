import React from 'react';
import { cn } from '@/lib/utils';

interface HBTagProps {
  children: React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export function HBTag({ children, active, count, onClick }: HBTagProps) {
  return (
    <span
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-2 py-1 text-xs font-mono border rounded-sm',
        active
          ? 'bg-gold/10 border-gold/30 text-gold'
          : 'bg-muted border-border text-muted-foreground',
        onClick && 'cursor-pointer hover:bg-accent',
      )}
    >
      <span
        className={cn(
          'w-1 h-1 rotate-45 shrink-0',
          active ? 'bg-gold' : 'bg-muted-foreground',
        )}
      />
      {children}
      {count != null && (
        <span className="text-[10px] text-muted-foreground">·{count}</span>
      )}
    </span>
  );
}
