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
    <div className={`ao-divide ${className}`} style={{ margin: '8px 0', ...style }}>
      {children ? (
        <>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--rule), var(--rule))' }} />
          <span className="ao-overline" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Rune kind={glyph} size={9} color={color} />
            {children}
            <Rune kind={glyph} size={9} color={color} />
          </span>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--rule), var(--rule), transparent)' }} />
        </>
      ) : (
        <>
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, transparent, var(--rule), var(--rule))' }} />
          <Rune kind={glyph} size={9} color={color} />
          <span style={{ flex: 1, height: 1, background: 'linear-gradient(90deg, var(--rule), var(--rule), transparent)' }} />
        </>
      )}
    </div>
  );
}
