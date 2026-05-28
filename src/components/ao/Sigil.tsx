import React from 'react';
import { Rune } from './Rune';

interface SigilProps {
  size?: number;
  glyph?: string;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Sigil({
  size = 64,
  glyph = 'sigil-1',
  color = 'var(--gold)',
  className = '',
  style,
}: SigilProps) {
  return (
    <div
      className={`ao-seal ${className}`}
      style={{
        width: size,
        height: size,
        ...style,
      }}
    >
      <Rune kind={glyph} size={size * 0.5} color={color} />
    </div>
  );
}
