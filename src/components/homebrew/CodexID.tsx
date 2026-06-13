import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import s from './CodexID.module.css';

interface CodexIDProps {
  children: ReactNode;
}

export function CodexID({ children }: CodexIDProps) {
  return <span className={cn('ao-codex', s.codex)}>{children}</span>;
}
