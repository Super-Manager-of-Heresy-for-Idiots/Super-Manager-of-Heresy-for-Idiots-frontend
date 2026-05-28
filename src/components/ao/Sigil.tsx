import React from 'react';

interface SigilProps {
  size?: number;
  color?: string;
  text?: string;
  className?: string;
  style?: React.CSSProperties;
}

export function Sigil({
  size = 48,
  color = 'var(--gold)',
  text = 'OA',
  className = '',
  style,
}: SigilProps) {
  return (
    <div
      className={`ao-seal ${className}`}
      style={{
        width: size,
        height: size,
        '--seal-color': color,
        ...style,
      } as React.CSSProperties}
    >
      <svg
        viewBox="0 0 100 100"
        width={size}
        height={size}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
      >
        {/* Outer ring */}
        <circle cx="50" cy="50" r="46" />
        {/* Inner ring */}
        <circle cx="50" cy="50" r="36" />
        {/* Decorative notches */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30 * Math.PI) / 180;
          const x1 = 50 + 36 * Math.cos(angle);
          const y1 = 50 + 36 * Math.sin(angle);
          const x2 = 50 + 46 * Math.cos(angle);
          const y2 = 50 + 46 * Math.sin(angle);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
        })}
        {/* Center text */}
        <text
          x="50"
          y="54"
          textAnchor="middle"
          fill={color}
          stroke="none"
          fontFamily="Cinzel, serif"
          fontSize="18"
          fontWeight="600"
          letterSpacing="2"
        >
          {text}
        </text>
      </svg>
    </div>
  );
}
