import type { ReactNode, CSSProperties, MouseEventHandler } from 'react';

interface OrdoPanelProps {
  children: ReactNode;
  raised?: boolean;
  inset?: boolean;
  frame?: boolean;
  padding?: number;
  className?: string;
  style?: CSSProperties;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

export function OrdoPanel({
  children,
  raised,
  inset,
  frame,
  padding = 16,
  className = '',
  style,
  onClick,
}: OrdoPanelProps) {
  const classes = [
    'ao-panel',
    raised && 'ao-panel--raised',
    inset && 'ao-panel--inset',
    frame && 'ao-frame',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={classes}
      style={{ padding, ...style }}
      onClick={onClick}
    >
      {frame && <span className="ao-frame-c" />}
      {children}
    </div>
  );
}
