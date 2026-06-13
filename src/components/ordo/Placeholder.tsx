import type { CSSProperties, ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PlaceholderProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Placeholder({ children, style, className }: PlaceholderProps) {
  return (
    <div className={cn('ao-placeholder', className)} style={style}>
      {children}
    </div>
  );
}
