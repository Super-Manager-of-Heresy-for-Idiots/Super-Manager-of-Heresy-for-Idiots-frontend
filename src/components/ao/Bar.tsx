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
  const fillCls = tone === 'gold' ? 'ao-bar-fill--gold' : tone === 'arcane' ? 'ao-bar-fill--arcane' : '';

  return (
    <div className={className} style={style}>
      {(label || showNumbers) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'baseline' }}>
          {label && <span className="ao-overline">{label}</span>}
          {showNumbers && (
            <span className="ao-num" style={{ color: 'var(--ink-bright)', fontSize: 13 }}>
              {value}<span style={{ color: 'var(--ink-faint)' }}> / {max}</span>
            </span>
          )}
        </div>
      )}
      <div className="ao-bar">
        <div className={`ao-bar-fill ${fillCls}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
