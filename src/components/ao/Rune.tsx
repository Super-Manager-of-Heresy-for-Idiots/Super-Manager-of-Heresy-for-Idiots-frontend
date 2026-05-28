import React from 'react';

interface RuneProps {
  kind?: string;
  size?: number;
  color?: string;
  stroke?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function Rune({
  kind = 'diamond',
  size = 14,
  color = 'currentColor',
  stroke = 1.2,
  className,
  style,
}: RuneProps) {
  const s = size;
  const base: React.SVGProps<SVGSVGElement> = {
    width: s,
    height: s,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: stroke,
    strokeLinecap: 'square',
    strokeLinejoin: 'miter',
    className,
    style: { display: 'inline-block', verticalAlign: 'middle', flexShrink: 0, ...style },
  };

  switch (kind) {
    case 'diamond': return <svg {...base}><path d="M12 3l9 9-9 9-9-9 9-9z"/></svg>;
    case 'diamond-fill': return <svg {...base} fill={color}><path d="M12 3l9 9-9 9-9-9 9-9z"/></svg>;
    case 'square': return <svg {...base}><path d="M4 4h16v16H4z"/></svg>;
    case 'square-rot': return <svg {...base}><path d="M12 2l10 10-10 10L2 12 12 2z M12 7l5 5-5 5-5-5 5-5z"/></svg>;
    case 'cross': return <svg {...base}><path d="M12 3v18M3 12h18"/></svg>;
    case 'cross-pat': return <svg {...base}><path d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18"/></svg>;
    case 'cir': return <svg {...base}><circle cx="12" cy="12" r="9"/></svg>;
    case 'cir-dot': return <svg {...base}><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="2.5" fill={color}/></svg>;
    case 'tri': return <svg {...base}><path d="M12 3l10 18H2L12 3z"/></svg>;
    case 'tri-inv': return <svg {...base}><path d="M2 4h20L12 21 2 4z"/></svg>;
    case 'hex': return <svg {...base}><path d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z"/></svg>;
    case 'eye': return <svg {...base}><path d="M2 12c4-6 16-6 20 0-4 6-16 6-20 0z"/><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="0.8" fill={color}/></svg>;
    case 'check': return <svg {...base}><path d="M4 12l5 5L20 6"/></svg>;
    case 'plus': return <svg {...base}><path d="M12 5v14M5 12h14"/></svg>;
    case 'minus': return <svg {...base}><path d="M5 12h14"/></svg>;
    case 'arrow-r': return <svg {...base}><path d="M5 12h14M13 6l6 6-6 6"/></svg>;
    case 'arrow-l': return <svg {...base}><path d="M19 12H5M11 6l-6 6 6 6"/></svg>;
    case 'arrow-up': return <svg {...base}><path d="M12 19V5M6 11l6-6 6 6"/></svg>;
    case 'lock': return <svg {...base}><rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 018 0v4"/></svg>;
    case 'flame': return <svg {...base}><path d="M12 3c2 4 6 6 6 11a6 6 0 11-12 0c0-3 2-4 2-7 2 2 4 2 4-4z"/></svg>;
    case 'book': return <svg {...base}><path d="M4 4h7v16H4zM13 4h7v16h-7zM4 8h7M13 8h7M4 12h7M13 12h7"/></svg>;
    case 'scroll': return <svg {...base}><path d="M4 5h14a2 2 0 012 2v10M4 5v12a2 2 0 002 2h12a2 2 0 002-2M4 5a2 2 0 012-2h12M8 9h8M8 13h6"/></svg>;
    case 'shield': return <svg {...base}><path d="M12 3l8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6l8-3z"/></svg>;
    case 'sword': return <svg {...base}><path d="M14 4l6 0 0 6-9 9-3-3 6-12zM5 19l3 3M4 16l4 4"/></svg>;
    case 'helm': return <svg {...base}><path d="M4 14c0-6 4-10 8-10s8 4 8 10v3a3 3 0 01-3 3H7a3 3 0 01-3-3v-3z M9 14h6"/></svg>;
    case 'coin': return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="M12 6v12M9 9h4a2 2 0 010 4h-2a2 2 0 000 4h4"/></svg>;
    case 'chev-r': return <svg {...base}><path d="M9 6l6 6-6 6"/></svg>;
    case 'chev-d': return <svg {...base}><path d="M6 9l6 6 6-6"/></svg>;
    case 'dots': return <svg {...base} fill={color} stroke="none"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>;
    case 'search': return <svg {...base}><circle cx="11" cy="11" r="6"/><path d="M16 16l5 5"/></svg>;
    case 'filter': return <svg {...base}><path d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/></svg>;
    case 'plus-sm': return <svg {...base}><path d="M12 6v12M6 12h12"/></svg>;
    case 'x': return <svg {...base}><path d="M6 6l12 12M18 6L6 18"/></svg>;
    case 'menu': return <svg {...base}><path d="M3 7h18M3 12h18M3 17h18"/></svg>;
    case 'sigil-1': return <svg {...base}><circle cx="12" cy="12" r="9"/><path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4"/></svg>;
    case 'sigil-2': return <svg {...base}><path d="M12 2l10 10-10 10L2 12 12 2z"/><circle cx="12" cy="12" r="4"/><path d="M12 8v8M8 12h8"/></svg>;
    case 'sigil-3': return <svg {...base}><path d="M12 3l9 5v8l-9 5-9-5V8l9-5zM12 12l9-5M12 12l-9-5M12 12v9"/></svg>;
    default: return <svg {...base}><circle cx="12" cy="12" r="9"/></svg>;
  }
}
