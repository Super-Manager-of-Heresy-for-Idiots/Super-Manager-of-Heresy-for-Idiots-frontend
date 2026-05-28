import React from 'react';
import { Rune } from './Rune';

interface DividerProps {
  glyph?: string;
  children?: React.ReactNode;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Divider({
  glyph = 'diamond-fill',
  children,
  color = 'var(--bronze)',
  className = '',
  style,
}: DividerProps) {
  return (
    <div className={`ao-divide ${className}`} style={style}>
      <span className="ao-divide__line" />
      {children ? (
        <span className="ao-divide__label" style={{ color }}>
          {children}
        </span>
      ) : (
        <Rune kind={glyph} size={10} color={color} />
      )}
      <span className="ao-divide__line" />
    </div>
  );
}
