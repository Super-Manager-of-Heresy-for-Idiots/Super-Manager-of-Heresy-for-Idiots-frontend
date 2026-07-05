import type { CSSProperties } from 'react';
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
const SVG_LOGO_SRC = '/brand/rota-perforata.svg';

export function RotaPerforataLogo({
  size = 48,
  variant = 'svg',
  className,
  label = 'Ordo Arcanum',
}: RotaPerforataLogoProps) {
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
      <img className={s.svgImage} src={SVG_LOGO_SRC} alt="" aria-hidden="true" draggable={false} />
    </span>
  );
}
