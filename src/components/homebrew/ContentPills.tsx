import { Sword, Shield, Eye, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContentPillsProps {
  items?: number;
  classes?: number;
  skills?: number;
  feats?: number;
  compact?: boolean;
}

export function ContentPills({ items = 0, classes = 0, skills = 0, feats = 0, compact = false }: ContentPillsProps) {
  const data = [
    { label: 'Items', v: items, icon: Sword },
    { label: 'Classes', v: classes, icon: Shield },
    { label: 'Skills', v: skills, icon: Eye },
    { label: 'Feats', v: feats, icon: Star },
  ];

  return (
    <div className={cn('flex flex-wrap', compact ? 'gap-1.5' : 'gap-2')}>
      {data.map((d) => {
        const Icon = d.icon;
        return (
          <div
            key={d.label}
            className={cn(
              'inline-flex items-center gap-1.5 bg-muted border border-border rounded-sm',
              compact ? 'px-2 py-0.5' : 'px-2.5 py-1',
            )}
          >
            <Icon className={cn('shrink-0', compact ? 'h-3 w-3' : 'h-3.5 w-3.5', d.v ? 'text-gold' : 'text-muted-foreground/40')} />
            <span className={cn('font-mono', compact ? 'text-[11px]' : 'text-xs', d.v ? 'text-foreground' : 'text-muted-foreground/40')}>
              {d.v}
            </span>
            <span className="text-[9px] text-muted-foreground">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}
