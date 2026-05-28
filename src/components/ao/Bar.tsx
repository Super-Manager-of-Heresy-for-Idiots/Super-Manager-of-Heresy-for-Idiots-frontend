import React from 'react';

interface BarProps {
  value: number;
  max: number;
  label?: string;
  tone?: 'ember' | 'gold' | 'arcane';
  showNumbers?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Bar({
  value,
  max,
  label,
  tone = 'ember',
  showNumbers = true,
  className = '',
  style,
}: BarProps) {
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0;

  return (
    <div className={`ao-bar ${className}`} style={style}>
      {(label || showNumbers) && (
        <div className="ao-bar__header">
          {label && <span className="ao-bar__label ao-overline">{label}</span>}
          {showNumbers && (
            <span className="ao-bar__numbers ao-num">
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div className="ao-bar__track">
        <div
          className={`ao-bar__fill ao-bar__fill--${tone}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
