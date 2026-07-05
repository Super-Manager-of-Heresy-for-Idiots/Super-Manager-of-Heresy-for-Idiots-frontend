import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import s from './OrdoInterfaceIcon.module.css';

export type OrdoInterfaceIconKey = string;

type IconStyle = CSSProperties & {
  '--ordo-interface-icon-url': string;
  '--ordo-interface-icon-size': string;
};

interface OrdoInterfaceIconProps extends Omit<HTMLAttributes<HTMLSpanElement>, 'children'> {
  icon: OrdoInterfaceIconKey;
  size?: number | string;
  decorative?: boolean;
}

function toSize(value: number | string): string {
  return typeof value === 'number' ? `${value}px` : value;
}

export function OrdoInterfaceIcon({
  icon,
  size = 16,
  decorative,
  className,
  style,
  title,
  ...props
}: OrdoInterfaceIconProps) {
  const isDecorative = decorative ?? !title;
  const iconStyle: IconStyle = {
    '--ordo-interface-icon-url': `url("/ordo-icons/interface/${icon}.svg")`,
    '--ordo-interface-icon-size': toSize(size),
    ...style,
  };

  return (
    <span
      {...props}
      className={cn(s.icon, className)}
      style={iconStyle}
      aria-hidden={isDecorative ? true : undefined}
      role={isDecorative ? undefined : 'img'}
      aria-label={isDecorative ? undefined : title ?? icon}
      title={title}
    />
  );
}
