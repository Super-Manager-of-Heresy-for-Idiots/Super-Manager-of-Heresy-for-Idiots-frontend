import React from 'react';

interface CodexIDProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function CodexID({
  children,
  className = '',
  style,
}: CodexIDProps) {
  return (
    <span className={`ao-codex ${className}`} style={style}>
      № {children}
    </span>
  );
}
