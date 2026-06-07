import type { ReactNode } from 'react';
import { Rune } from './Rune';

interface OrdoDividerProps {
  glyph?: string;
  children?: ReactNode;
  color?: string;
}

export function OrdoDivider({
  glyph = 'diamond',
  children,
  color = 'var(--rule)',
}: OrdoDividerProps) {
  const line = (
    <span
      style={{
        flex: 1,
        height: 1,
        background: color,
      }}
    />
  );

  if (children) {
    return (
      <div className="ao-divide">
        {line}
        <span className="ao-overline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <Rune kind={glyph} size={10} color={color} />
          {children}
        </span>
        {line}
      </div>
    );
  }

  return (
    <div className="ao-divide">
      {line}
      <Rune kind={glyph} size={10} color={color} />
      {line}
    </div>
  );
}
