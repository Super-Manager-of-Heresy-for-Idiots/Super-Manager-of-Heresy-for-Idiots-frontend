import type { CSSProperties, ReactNode } from 'react';

interface PlaceholderProps {
  children?: ReactNode;
  style?: CSSProperties;
  className?: string;
}

export function Placeholder({ children, style, className }: PlaceholderProps) {
  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--abyss)',
        border: '1px solid var(--rule)',
        color: 'var(--ink-ghost)',
        fontFamily: 'var(--font-mono)',
        fontSize: 9,
        textTransform: 'uppercase',
        letterSpacing: '0.1em',
        overflow: 'hidden',
        ...style,
      }}
    >
      {children}
    </div>
  );
}
