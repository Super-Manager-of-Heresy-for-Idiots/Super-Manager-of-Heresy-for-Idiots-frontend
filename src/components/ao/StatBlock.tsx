import React from 'react';

interface StatBlockProps {
  label: string;
  value: number;
  modifier?: number;
  big?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function StatBlock({
  label,
  value,
  modifier,
  big = false,
  className = '',
  style,
}: StatBlockProps) {
  const mod = modifier ?? Math.floor((value - 10) / 2);
  const sign = mod >= 0 ? '+' : '';

  return (
    <div className={`ao-stat ao-frame ${className}`} style={big ? { padding: '16px 12px', ...style } : style}>
      <span className="ao-frame-c" />
      <div className="ao-stat-label">{label}</div>
      <div className="ao-stat-value" style={big ? { fontSize: 48 } : {}}>{value}</div>
      <div className="ao-stat-mod">{sign}{mod}</div>
    </div>
  );
}
