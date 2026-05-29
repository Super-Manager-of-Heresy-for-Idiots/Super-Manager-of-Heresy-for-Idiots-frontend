import type { ReactElement } from 'react';

interface RuneProps {
  kind: string;
  size?: number;
  color?: string;
  className?: string;
}

type GlyphRenderer = (c: string) => ReactElement[];

const glyphs: Record<string, GlyphRenderer> = {
  diamond: () => [<path key="p" d="M12 3l9 9-9 9-9-9 9-9z" />],
  'diamond-fill': (c) => [<path key="p" d="M12 3l9 9-9 9-9-9 9-9z" fill={c} />],
  square: () => [<path key="p" d="M4 4h16v16H4z" />],
  'square-rot': () => [
    <path key="p" d="M12 2l10 10-10 10L2 12 12 2z M12 7l5 5-5 5-5-5 5-5z" />,
  ],
  cross: () => [<path key="p" d="M12 3v18M3 12h18" />],
  'cross-pat': () => [<path key="p" d="M12 3v18M3 12h18M6 6l12 12M18 6L6 18" />],
  cir: () => [<circle key="c" cx="12" cy="12" r="9" />],
  'cir-dot': (c) => [
    <circle key="c1" cx="12" cy="12" r="9" />,
    <circle key="c2" cx="12" cy="12" r="2.5" fill={c} />,
  ],
  tri: () => [<path key="p" d="M12 3l10 18H2L12 3z" />],
  'tri-inv': () => [<path key="p" d="M2 4h20L12 21 2 4z" />],
  hex: () => [<path key="p" d="M12 2l8.66 5v10L12 22 3.34 17V7L12 2z" />],
  eye: (c) => [
    <path key="p1" d="M2 12c4-6 16-6 20 0-4 6-16 6-20 0z" />,
    <circle key="c1" cx="12" cy="12" r="3" />,
    <circle key="c2" cx="12" cy="12" r="0.8" fill={c} />,
  ],
  check: () => [<path key="p" d="M4 12l5 5L20 6" />],
  plus: () => [<path key="p" d="M12 5v14M5 12h14" />],
  minus: () => [<path key="p" d="M5 12h14" />],
  'arrow-r': () => [<path key="p" d="M5 12h14M13 6l6 6-6 6" />],
  'arrow-l': () => [<path key="p" d="M19 12H5M11 6l-6 6 6 6" />],
  'arrow-up': () => [<path key="p" d="M12 19V5M6 11l6-6 6 6" />],
  lock: () => [
    <rect key="r" x="5" y="11" width="14" height="10" />,
    <path key="p" d="M8 11V7a4 4 0 018 0v4" />,
  ],
  flame: () => [
    <path key="p" d="M12 3c2 4 6 6 6 11a6 6 0 11-12 0c0-3 2-4 2-7 2 2 4 2 4-4z" />,
  ],
  book: () => [
    <path key="p" d="M4 4h7v16H4zM13 4h7v16h-7zM4 8h7M13 8h7M4 12h7M13 12h7" />,
  ],
  scroll: () => [
    <path
      key="p"
      d="M4 5h14a2 2 0 012 2v10M4 5v12a2 2 0 002 2h12a2 2 0 002-2M4 5a2 2 0 012-2h12M8 9h8M8 13h6"
    />,
  ],
  shield: () => [
    <path key="p" d="M12 3l8 3v6c0 5-3 8-8 9-5-1-8-4-8-9V6l8-3z" />,
  ],
  sword: () => [
    <path key="p" d="M14 4l6 0 0 6-9 9-3-3 6-12zM5 19l3 3M4 16l4 4" />,
  ],
  helm: () => [
    <path
      key="p"
      d="M4 14c0-6 4-10 8-10s8 4 8 10v3a3 3 0 01-3 3H7a3 3 0 01-3-3v-3z M9 14h6"
    />,
  ],
  coin: () => [
    <circle key="c" cx="12" cy="12" r="9" />,
    <path key="p" d="M12 6v12M9 9h4a2 2 0 010 4h-2a2 2 0 000 4h4" />,
  ],
  'chev-r': () => [<path key="p" d="M9 6l6 6-6 6" />],
  'chev-d': () => [<path key="p" d="M6 9l6 6 6-6" />],
  dots: (c) => [
    <circle key="c1" cx="6" cy="12" r="1.6" fill={c} stroke="none" />,
    <circle key="c2" cx="12" cy="12" r="1.6" fill={c} stroke="none" />,
    <circle key="c3" cx="18" cy="12" r="1.6" fill={c} stroke="none" />,
  ],
  search: () => [
    <circle key="c" cx="11" cy="11" r="6" />,
    <path key="p" d="M16 16l5 5" />,
  ],
  filter: () => [<path key="p" d="M3 5h18l-7 9v6l-4-2v-4L3 5z" />],
  'plus-sm': () => [<path key="p" d="M12 6v12M6 12h12" />],
  x: () => [<path key="p" d="M6 6l12 12M18 6L6 18" />],
  menu: () => [<path key="p" d="M3 7h18M3 12h18M3 17h18" />],
  'sigil-1': () => [
    <circle key="c" cx="12" cy="12" r="9" />,
    <path key="p" d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M18.4 5.6L5.6 18.4" />,
  ],
  'sigil-2': () => [
    <path key="p1" d="M12 2l10 10-10 10L2 12 12 2z" />,
    <circle key="c" cx="12" cy="12" r="4" />,
    <path key="p2" d="M12 8v8M8 12h8" />,
  ],
  'sigil-3': () => [
    <path key="p1" d="M12 3l9 5v8l-9 5-9-5V8l9-5zM12 12l9-5M12 12l-9-5M12 12v9" />,
  ],
};

const defaultGlyph: GlyphRenderer = () => [
  <circle key="c" cx="12" cy="12" r="9" />,
];

export function Rune({
  kind,
  size = 14,
  color = 'currentColor',
  className,
}: RuneProps) {
  const renderer = glyphs[kind] ?? defaultGlyph;
  const children = renderer(color);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="square"
      strokeLinejoin="miter"
      className={className}
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}
