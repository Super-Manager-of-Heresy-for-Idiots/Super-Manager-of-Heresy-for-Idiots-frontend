import React from 'react';
import { Rune } from './Rune';

interface ChipProps {
  children: React.ReactNode;
  tone?: 'gold' | 'arcane' | 'ember' | 'rune' | 'muted';
  glyph?: string;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export function Chip({
  children,
  tone = 'gold',
  glyph,
  className = '',
  style,
  onClick,
}: ChipProps) {
  return (
    <span
      className={`ao-chip ao-chip--${tone} ${className}`}
      style={style}
      onClick={onClick}
    >
      {glyph && <Rune kind={glyph} size={8} />}
      {children}
    </span>
  );
}
