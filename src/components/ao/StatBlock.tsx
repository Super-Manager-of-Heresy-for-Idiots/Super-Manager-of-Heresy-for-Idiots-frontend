import React from 'react';

interface StatBlockProps {
  label: string;
  value: number;
  modifier?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function StatBlock({
  label,
  value,
  modifier,
  className = '',
  style,
}: StatBlockProps) {
  const mod = modifier ?? Math.floor((value - 10) / 2);
  const sign = mod >= 0 ? '+' : '';

  return (
    <div className={`ao-stat ao-frame ${className}`} style={style}>
      <span className="ao-frame__corner ao-frame__corner--tl" />
      <span className="ao-frame__corner ao-frame__corner--tr" />
      <span className="ao-frame__corner ao-frame__corner--bl" />
      <span className="ao-frame__corner ao-frame__corner--br" />
      <div className="ao-stat__label ao-overline">{label}</div>
      <div className="ao-stat__value ao-num">{value}</div>
      <div className="ao-stat__mod ao-num">
        {sign}{mod}
      </div>
    </div>
  );
}
