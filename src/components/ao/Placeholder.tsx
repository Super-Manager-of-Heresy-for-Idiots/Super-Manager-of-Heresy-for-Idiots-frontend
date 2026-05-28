import React from 'react';

interface PlaceholderProps {
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Placeholder({
  children = 'portrait',
  className = '',
  style,
}: PlaceholderProps) {
  return (
    <div className={`ao-ph ${className}`} style={style}>
      {children}
    </div>
  );
}
