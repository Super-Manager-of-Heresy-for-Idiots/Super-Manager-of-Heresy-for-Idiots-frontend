import React from 'react';
import { Rune } from './Rune';

interface PlaceholderProps {
  width?: number | string;
  height?: number | string;
  glyph?: string;
  label?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Placeholder({
  width = '100%',
  height = 200,
  glyph = 'sigil-3',
  label = 'No Image',
  className = '',
  style,
}: PlaceholderProps) {
  return (
    <div
      className={`ao-placeholder ${className}`}
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        background: 'var(--surface-1)',
        border: '1px dashed var(--border)',
        color: 'var(--ink-faint)',
        ...style,
      }}
    >
      <Rune kind={glyph} size={32} color="var(--ink-faint)" />
      {label && <span className="ao-overline" style={{ fontSize: 10 }}>{label}</span>}
    </div>
  );
}
