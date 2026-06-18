// ── Portrait placeholder generator (data-URI SVG) ──────────
const PORTRAIT_GLYPHS: Record<string, string> = {
  diamond: '<path d="M60 28 92 60 60 92 28 60Z"/>',
  hex: '<path d="M60 26 89 43v34L60 94 31 77V43Z"/>',
  shield: '<path d="M60 28l26 10v22c0 16-10 26-26 30-16-4-26-14-26-30V38z"/>',
  flame: '<path d="M60 28c8 14 22 20 22 38a22 22 0 11-44 0c0-10 6-14 8-24 6 6 14 6 14-14z"/>',
  eye: '<path d="M24 60c14-20 58-20 72 0-14 20-58 20-72 0z"/><circle cx="60" cy="60" r="10"/>',
  cross: '<path d="M60 30v60M30 60h60"/>',
};

export function makePortrait(hue: number, glyph: string): string {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120' viewBox='0 0 120 120'>
    <defs><radialGradient id='g' cx='40%' cy='32%' r='80%'>
      <stop offset='0%' stop-color='hsl(${hue},32%,26%)'/><stop offset='100%' stop-color='hsl(${hue},38%,8%)'/>
    </radialGradient></defs>
    <rect width='120' height='120' fill='url(%23g)'/>
    <g fill='none' stroke='hsl(${hue},45%,62%)' stroke-width='2' opacity='0.85'>${PORTRAIT_GLYPHS[glyph]}</g>
  </svg>`;
  return 'data:image/svg+xml;utf8,' + encodeURIComponent(svg.replace(/%23/g, '#'));
}

export const PORTRAIT_GALLERY: { hue: number; glyph: string }[] = [
  { hue: 28, glyph: 'flame' }, { hue: 0, glyph: 'shield' }, { hue: 190, glyph: 'eye' },
  { hue: 150, glyph: 'hex' }, { hue: 268, glyph: 'diamond' }, { hue: 45, glyph: 'cross' },
];

export const CLASS_GLYPH: Record<string, string> = {
  barbarian: 'sword', bard: 'scroll', cleric: 'cross-pat', druid: 'flame', fighter: 'shield',
  monk: 'cir-dot', paladin: 'shield', ranger: 'tri', rogue: 'diamond', sorcerer: 'sigil-1',
  warlock: 'eye', wizard: 'book',
};

/** Glyph for a class by slug (preferred) or name, defaulting to a generic book. */
export function glyphForClass(slug?: string, name?: string): string {
  return CLASS_GLYPH[(slug || name || '').trim().toLowerCase()] ?? 'book';
}
