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
      {frame && <span className="ao-frame-c" />}
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
    <div
      className={`ao-panel-header ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 18px',
        borderBottom: '1px solid var(--rule)',
        background: 'linear-gradient(180deg, rgba(176,141,78,0.04), transparent)',
      }}
    >
      <Rune kind={glyph} size={10} color={toneColor} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div className="ao-engraved" style={{ fontSize: 13 }}>{title}</div>
        {sub && <div className="ao-codex" style={{ marginTop: 2 }}>{sub}</div>}
      </div>
      {right}
    </div>
  );
}
