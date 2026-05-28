import React from 'react';

interface BackdropProps {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

export function Backdrop({ children, className = '', style }: BackdropProps) {
  return (
    <div className={`ao-root ${className}`} style={style}>
      <div className="ao-grain" />
      <div className="ao-vignette" />
      {children}
    </div>
  );
}
