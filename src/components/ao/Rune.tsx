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
    /* ── Shapes ── */
    case 'diamond':
      return <svg {...base}><path d="M12 3l9 9-9 9-9-9 9-9z" /></svg>;
    case 'diamond-fill':
      return <svg {...base} fill={color}><path d="M12 3l9 9-9 9-9-9 9-9z" /></svg>;
    case 'square':
      return <svg {...base}><rect x="4" y="4" width="16" height="16" /></svg>;
    case 'square-rot':
      return (
        <svg {...base}>
          <rect x="4" y="4" width="16" height="16" transform="rotate(45 12 12)" />
        </svg>
      );
    case 'cross':
      return (
        <svg {...base}>
          <path d="M12 4v16M4 12h16" />
        </svg>
      );
    case 'cross-pat':
      return (
        <svg {...base}>
          <path d="M10 3h4v7h7v4h-7v7h-4v-7H3v-4h7V3z" />
        </svg>
      );
    case 'cir':
      return <svg {...base}><circle cx="12" cy="12" r="9" /></svg>;
    case 'cir-dot':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="2" fill={color} />
        </svg>
      );
    case 'tri':
      return <svg {...base}><path d="M12 4l9 16H3z" /></svg>;
    case 'tri-inv':
      return <svg {...base}><path d="M12 20L3 4h18z" /></svg>;
    case 'hex':
      return <svg {...base}><path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /></svg>;
    case 'eye':
      return (
        <svg {...base}>
          <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );

    /* ── Actions ── */
    case 'check':
      return <svg {...base}><path d="M5 13l4 4L19 7" /></svg>;
    case 'plus':
      return <svg {...base}><path d="M12 5v14M5 12h14" /></svg>;
    case 'minus':
      return <svg {...base}><path d="M5 12h14" /></svg>;
    case 'plus-sm':
      return <svg {...base}><path d="M12 8v8M8 12h8" /></svg>;
    case 'x':
      return <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>;

    /* ── Arrows / Chevrons ── */
    case 'arrow-r':
      return <svg {...base}><path d="M5 12h14M13 6l6 6-6 6" /></svg>;
    case 'arrow-l':
      return <svg {...base}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>;
    case 'arrow-up':
      return <svg {...base}><path d="M12 19V5M6 11l6-6 6 6" /></svg>;
    case 'chev-r':
      return <svg {...base}><path d="M9 6l6 6-6 6" /></svg>;
    case 'chev-d':
      return <svg {...base}><path d="M6 9l6 6 6-6" /></svg>;

    /* ── UI ── */
    case 'lock':
      return (
        <svg {...base}>
          <rect x="5" y="11" width="14" height="10" rx="1" />
          <path d="M8 11V7a4 4 0 018 0v4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...base}>
          <circle cx="11" cy="11" r="7" />
          <path d="M16 16l5 5" />
        </svg>
      );
    case 'filter':
      return <svg {...base}><path d="M3 4h18l-7 8v6l-4 2V12z" /></svg>;
    case 'menu':
      return <svg {...base}><path d="M4 6h16M4 12h16M4 18h16" /></svg>;
    case 'dots':
      return (
        <svg {...base}>
          <circle cx="12" cy="6" r="1.5" fill={color} />
          <circle cx="12" cy="12" r="1.5" fill={color} />
          <circle cx="12" cy="18" r="1.5" fill={color} />
        </svg>
      );

    /* ── Themed / RPG ── */
    case 'flame':
      return (
        <svg {...base}>
          <path d="M12 22c-4 0-7-3-7-7 0-3 2-5 4-8 1-1.5 2-3 3-5 1 2 2 3.5 3 5 2 3 4 5 4 8 0 4-3 7-7 7z" />
          <path d="M12 22c-1.5 0-3-1.5-3-3.5 0-1.5 1-2.5 2-4 .5-.75 1-1.5 1-2.5.5 1 1 1.75 1 2.5 1 1.5 2 2.5 2 4 0 2-1.5 3.5-3 3.5z" />
        </svg>
      );
    case 'book':
      return (
        <svg {...base}>
          <path d="M4 19V5a2 2 0 012-2h12a2 2 0 012 2v14" />
          <path d="M4 19a2 2 0 012-2h12a2 2 0 012 2" />
          <path d="M4 19a2 2 0 002 2h12a2 2 0 002-2" />
        </svg>
      );
    case 'scroll':
      return (
        <svg {...base}>
          <path d="M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
          <path d="M10 7h4M10 11h4M10 15h2" />
        </svg>
      );
    case 'shield':
      return (
        <svg {...base}>
          <path d="M12 3l8 4v5c0 5-3.5 8.5-8 10-4.5-1.5-8-5-8-10V7l8-4z" />
        </svg>
      );
    case 'sword':
      return (
        <svg {...base}>
          <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
          <path d="M13 19l6-6" />
          <path d="M16 16l3.5 3.5" />
          <path d="M19.5 19.5L21 21" />
        </svg>
      );
    case 'helm':
      return (
        <svg {...base}>
          <path d="M12 3C7 3 4 7 4 12v3h2v-1a2 2 0 014 0v1h4v-1a2 2 0 014 0v1h2v-3c0-5-3-9-8-9z" />
          <path d="M4 15v2a3 3 0 003 3h10a3 3 0 003-3v-2" />
        </svg>
      );
    case 'coin':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M9 9.5c0-1.1 1.3-2 3-2s3 .9 3 2-1.3 2-3 2-3 .9-3 2 1.3 2 3 2 3-.9 3-2" />
        </svg>
      );

    /* ── Sigils ── */
    case 'sigil-1':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v10M8 9l4 3 4-3M8 15l4-3 4 3" />
        </svg>
      );
    case 'sigil-2':
      return (
        <svg {...base}>
          <polygon points="12,3 15,10 22,10 16.5,14.5 18.5,21 12,17 5.5,21 7.5,14.5 2,10 9,10" />
        </svg>
      );
    case 'sigil-3':
      return (
        <svg {...base}>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="4" />
          <path d="M12 3v5M12 16v5M3 12h5M16 12h5" />
        </svg>
      );

    default:
      return <svg {...base}><circle cx="12" cy="12" r="9" /></svg>;
  }
}
