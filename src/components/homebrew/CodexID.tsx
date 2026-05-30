import type { ReactNode } from 'react';

interface CodexIDProps {
  children: ReactNode;
}

export function CodexID({ children }: CodexIDProps) {
  return (
    <span
      className="ao-codex"
      style={{
        fontSize: 11,
        color: 'var(--ink-faint)',
        letterSpacing: '0.05em',
      }}
    >
      {children}
    </span>
  );
}
