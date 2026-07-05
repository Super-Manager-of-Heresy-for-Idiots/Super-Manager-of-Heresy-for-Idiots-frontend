import { useId, type CSSProperties } from 'react';
import { cn } from '@/lib/utils';
import s from './RotaPerforataLogo.module.css';

type RotaPerforataVariant = 'svg' | 'mechanism' | 'flicker';

interface RotaPerforataLogoProps {
  size?: number;
  variant?: RotaPerforataVariant;
  className?: string;
  label?: string;
}

const spokes = Array.from({ length: 8 }, (_, index) => index);

export function RotaPerforataLogo({
  size = 48,
  variant = 'svg',
  className,
  label = 'Ordo Arcanum',
}: RotaPerforataLogoProps) {
  const rawId = useId().replace(/:/g, '');
  const goldId = `rpGold-${rawId}`;
  const goldSoftId = `rpGoldSoft-${rawId}`;
  const glowId = `rpGlow-${rawId}`;
  const style = { '--rota-size': `${size}px` } as CSSProperties;
  const isCss = variant !== 'svg';

  if (isCss) {
    return (
      <span
        className={cn(s.logo, variant === 'mechanism' && s.spin, variant === 'flicker' && s.flicker, className)}
        style={style}
        role="img"
        aria-label={label}
      >
        <span className={s.stage}>
          {variant === 'flicker' && <span className={s.glow} />}
          <span className={s.mark}>
            <span className={s.ringOuter} />
            <span className={s.ringInner} />
            <span className={s.squareLarge} />
            <span className={s.squareSmall} />
            <span className={s.wheel}>
              {spokes.map((index) => (
                <span key={index} className={cn(s.spoke, s[`spoke${index}`])} />
              ))}
            </span>
            <span className={s.wheelRing} />
            <span className={s.wheelInner} />
            <span className={s.hub} />
          </span>
        </span>
      </span>
    );
  }

  return (
    <span className={cn(s.logo, className)} style={style} role="img" aria-label={label}>
      <svg className={s.svg} viewBox="0 0 200 200" aria-hidden="true">
        <defs>
          <linearGradient id={goldId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e3c98c" />
            <stop offset="0.46" stopColor="#b08d4e" />
            <stop offset="1" stopColor="#6a5128" />
          </linearGradient>
          <linearGradient id={goldSoftId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d4b478" />
            <stop offset="1" stopColor="#836a3a" />
          </linearGradient>
          <radialGradient id={glowId} cx="50%" cy="42%" r="58%">
            <stop offset="0" stopColor="#b08d4e" stopOpacity="0.3" />
            <stop offset="60%" stopColor="#b08d4e" stopOpacity="0.06" />
            <stop offset="100%" stopColor="#b08d4e" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx="100" cy="100" r="98" fill={`url(#${glowId})`} />
        <circle cx="100" cy="100" r="90" fill="none" stroke={`url(#${goldSoftId})`} strokeWidth="1.6" />
        <circle cx="100" cy="100" r="84" fill="none" stroke="#b08d4e" strokeOpacity="0.22" strokeWidth="0.8" />
        <rect x="38" y="38" width="124" height="124" rx="2" fill="none" stroke="#9a7c4a" strokeOpacity="0.3" strokeWidth="1.1" />
        <rect x="56" y="56" width="88" height="88" rx="2" fill="none" stroke="#9a7c4a" strokeOpacity="0.32" strokeWidth="1.1" transform="rotate(45 100 100)" />
        <circle cx="100" cy="100" r="41" fill="none" stroke={`url(#${goldId})`} strokeWidth="4.5" />
        <circle cx="100" cy="100" r="34" fill="none" stroke="#b08d4e" strokeOpacity="0.3" strokeWidth="0.8" />
        <g stroke="#cfa962" strokeWidth="3.4">
          {spokes.map((index) => (
            <line
              key={index}
              x1="100"
              y1="84"
              x2="100"
              y2="63"
              transform={`rotate(${index * 45} 100 100)`}
            />
          ))}
        </g>
        <circle cx="100" cy="100" r="12" fill="none" stroke="#cfa962" strokeWidth="2.2" />
      </svg>
    </span>
  );
}
