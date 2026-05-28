import React from 'react';
import { Rune } from './Rune';

/* ── Panel ── */

interface PanelProps {
  children: React.ReactNode;
  raised?: boolean;
  inset?: boolean;
  frame?: boolean;
  style?: React.CSSProperties;
  className?: string;
  padding?: number;
  onClick?: () => void;
}

export function Panel({
  children,
  raised,
  inset,
  frame,
  style,
  className = '',
  padding = 16,
  onClick,
}: PanelProps) {
  const cls = [
    'ao-panel',
    raised && 'ao-panel--raised',
    inset && 'ao-panel--inset',
    frame && 'ao-frame',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={cls} style={{ padding, ...style }} onClick={onClick}>
      {frame && (
        <>
          <span className="ao-frame__corner ao-frame__corner--tl" />
          <span className="ao-frame__corner ao-frame__corner--tr" />
          <span className="ao-frame__corner ao-frame__corner--bl" />
          <span className="ao-frame__corner ao-frame__corner--br" />
        </>
      )}
      {children}
    </div>
  );
}

/* ── PanelHeader ── */

interface PanelHeaderProps {
  title: string;
  sub?: string;
  glyph?: string;
  right?: React.ReactNode;
  tone?: 'gold' | 'arcane' | 'ember';
  className?: string;
}

export function PanelHeader({
  title,
  sub,
  glyph = 'diamond-fill',
  right,
  tone = 'gold',
  className = '',
}: PanelHeaderProps) {
  const toneColor =
    tone === 'arcane'
      ? 'var(--arcane)'
      : tone === 'ember'
        ? 'var(--ember)'
        : 'var(--gold)';

  return (
    <div className={`ao-panel-header ${className}`}>
      <div className="ao-panel-header__left">
        <Rune kind={glyph} size={16} color={toneColor} />
        <div>
          <div className="ao-overline" style={{ color: toneColor }}>
            {title}
          </div>
          {sub && (
            <div className="ao-panel-header__sub">{sub}</div>
          )}
        </div>
      </div>
      {right && <div className="ao-panel-header__right">{right}</div>}
    </div>
  );
}
