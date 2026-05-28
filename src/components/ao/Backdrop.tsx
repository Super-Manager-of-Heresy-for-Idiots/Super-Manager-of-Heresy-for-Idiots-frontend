import React from 'react';

interface BackdropProps {
  children: React.ReactNode;
  dark?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function Backdrop({ children, dark = false, className = '', style }: BackdropProps) {
  return (
    <div
      className={`ao-root ao-grain ao-vignette ${className}`}
      style={{ background: dark ? 'var(--void)' : 'var(--stone)', ...style }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(80% 60% at 50% 0%, rgba(176, 141, 78, 0.04), transparent 60%)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />
      <div style={{ position: 'relative', zIndex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
        {children}
      </div>
    </div>
  );
}
