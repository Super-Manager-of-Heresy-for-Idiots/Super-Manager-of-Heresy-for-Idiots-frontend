import React from 'react';

interface CodexIDProps {
  id: string;
  prefix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function CodexID({
  id,
  prefix = 'CDX',
  className = '',
  style,
}: CodexIDProps) {
  const short = id.length > 8 ? id.slice(0, 8).toUpperCase() : id.toUpperCase();

  return (
    <span className={`ao-codex ${className}`} style={style}>
      {prefix}-{short}
    </span>
  );
}
