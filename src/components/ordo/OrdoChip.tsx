import type { ReactNode } from 'react';
import { Rune } from './Rune';

interface OrdoChipProps {
  children: ReactNode;
  tone?: 'gold' | 'arcane' | 'ember' | 'rune';
  glyph?: string;
}

export function OrdoChip({ children, tone, glyph }: OrdoChipProps) {
  const classes = ['ao-chip', tone && `ao-chip--${tone}`]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {glyph && <Rune kind={glyph} size={10} />}
      {children}
    </span>
  );
}
