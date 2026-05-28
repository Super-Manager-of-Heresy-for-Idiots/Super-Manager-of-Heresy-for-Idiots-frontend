import React from 'react';
import { Rune } from './Rune';

type Rarity = 'common' | 'rare' | 'epic' | 'cursed' | 'filled';

interface SlotProps {
  children?: React.ReactNode;
  rarity?: Rarity;
  empty?: boolean;
  glyph?: string;
  label?: string;
  onClick?: () => void;
  selected?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Slot({
  children,
  rarity,
  empty = false,
  glyph,
  label,
  onClick,
  selected = false,
  className = '',
  style,
}: SlotProps) {
  const cls = [
    'ao-slot',
    rarity && `ao-slot--${rarity}`,
    empty && 'ao-slot--empty',
    selected && 'ao-slot--selected',
    onClick && 'ao-slot--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} style={style} onClick={onClick} title={label}>
      {children ? (
        children
      ) : empty && glyph ? (
        <Rune kind={glyph} size={20} color="var(--ink-faint)" />
      ) : empty ? (
        <Rune kind="plus-sm" size={16} color="var(--ink-faint)" />
      ) : null}
      {label && <div className="ao-slot__label">{label}</div>}
    </div>
  );
}
