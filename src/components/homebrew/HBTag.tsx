import React from 'react';

interface HBTagProps {
  children: React.ReactNode;
  active?: boolean;
  count?: number;
  onClick?: () => void;
}

export function HBTag({ children, active, count, onClick }: HBTagProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 9px',
        background: active ? 'rgba(176, 141, 78, 0.10)' : 'var(--abyss)',
        border: `1px solid ${active ? 'var(--brass)' : 'var(--hairline)'}`,
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: active ? 'var(--gold-pale)' : 'var(--ink-quiet)',
        cursor: onClick ? 'pointer' : undefined,
      }}
    >
      <span style={{
        width: 4,
        height: 4,
        background: active ? 'var(--gold)' : 'var(--bronze)',
        transform: 'rotate(45deg)',
        flexShrink: 0,
      }} />
      {children}
      {count != null && (
        <span className="ao-codex" style={{ color: 'var(--ink-faint)', fontSize: 10 }}>·{count}</span>
      )}
    </span>
  );
}
