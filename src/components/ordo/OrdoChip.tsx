import type { ReactNode } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import { Rune } from './Rune';

interface OrdoChipProps {
  children: ReactNode;
  tone?: 'gold' | 'arcane' | 'ember' | 'rune';
  glyph?: string;
  icon?: OrdoInterfaceIconKey;
}

export function OrdoChip({ children, tone, glyph, icon }: OrdoChipProps) {
  const classes = ['ao-chip', tone && `ao-chip--${tone}`]
    .filter(Boolean)
    .join(' ');

  return (
    <span className={classes}>
      {icon ? <OrdoInterfaceIcon icon={icon} size={10} /> : glyph ? <Rune kind={glyph} size={10} /> : null}
      {children}
    </span>
  );
}
