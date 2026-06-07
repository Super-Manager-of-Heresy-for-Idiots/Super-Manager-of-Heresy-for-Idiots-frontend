interface BarProps {
  value: number;
  max: number;
  tone?: 'gold' | 'arcane' | 'ember';
  height?: number;
  showNumbers?: boolean;
  className?: string;
}

export function Bar({ value, max, tone = 'gold', height = 8, showNumbers = true, className }: BarProps) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const fillClass = tone === 'arcane' ? 'ao-bar-fill--arcane' : tone === 'ember' ? 'ao-bar-fill--ember' : '';

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className={`ao-bar ${className || ''}`} style={{ flex: 1, height }}>
        <div className={`ao-bar-fill ${fillClass}`} style={{ width: `${pct}%` }} />
      </div>
      {showNumbers && (
        <span className="ao-num" style={{ fontSize: 11, color: 'var(--ink-quiet)', flexShrink: 0 }}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      )}
    </div>
  );
}
