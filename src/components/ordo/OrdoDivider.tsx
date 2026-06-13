import type { CSSProperties, ReactNode } from 'react';
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
  const line = <span className="ao-divide-line" style={{ '--line-color': color } as CSSProperties} />;

  if (children) {
    return (
      <div className="ao-divide">
        {line}
        <span className="ao-overline ao-divide-label">
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
