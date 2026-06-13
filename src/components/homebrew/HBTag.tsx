import React from 'react';
import { cn } from '@/lib/utils';
import s from './HBTag.module.css';

interface HBTagProps {
  children: React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export function HBTag({ children, active, count, onClick }: HBTagProps) {
  return (
    <span onClick={onClick} className={cn(s.tag, active && s.active, onClick && s.clickable)}>
      <span className={s.dot} />
      {children}
      {count != null && <span className={cn('ao-codex', s.count)}>·{count}</span>}
    </span>
  );
}
