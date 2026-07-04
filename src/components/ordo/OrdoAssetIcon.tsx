import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { findOrdoIcon, type OrdoIconSource } from '@/lib/ordoIcons';
import s from './OrdoAssetIcon.module.css';

interface OrdoAssetIconProps {
  names: readonly (string | null | undefined)[];
  source?: OrdoIconSource;
  alt?: string;
  className?: string;
  imgClassName?: string;
  fallback?: ReactNode;
  decorative?: boolean;
}

export function OrdoAssetIcon({
  names,
  source = 'any',
  alt,
  className,
  imgClassName,
  fallback = null,
  decorative = true,
}: OrdoAssetIconProps) {
  const icon = findOrdoIcon(names, source);
  if (!icon) return <>{fallback}</>;

  const label = alt ?? icon.name;
  return (
    <span className={cn(s.root, className)}>
      <img
        className={cn(s.img, imgClassName)}
        src={icon.src}
        alt={decorative ? '' : label}
        aria-hidden={decorative ? true : undefined}
        loading="lazy"
        decoding="async"
        draggable={false}
      />
    </span>
  );
}
