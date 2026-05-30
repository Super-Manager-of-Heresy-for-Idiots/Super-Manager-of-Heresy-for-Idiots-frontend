import { Rune } from './Rune';

interface RoleBadgeProps {
  role: 'GM' | 'PLAYER' | 'ADMIN';
}

const ROLE_MAP = {
  GM: { label: 'Game-Master', glyph: 'eye' as const, color: 'var(--arcane)' },
  PLAYER: { label: 'Player', glyph: 'shield' as const, color: 'var(--gold)' },
  ADMIN: { label: 'Admin', glyph: 'sigil-1' as const, color: 'var(--ember)' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const m = ROLE_MAP[role] || ROLE_MAP.PLAYER;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '3px 9px 3px 7px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${m.color}55`,
        borderLeft: `2px solid ${m.color}`,
        fontFamily: 'var(--font-display)',
        fontSize: 10,
        letterSpacing: '0.16em',
        color: m.color,
        textTransform: 'uppercase',
      }}
    >
      <Rune kind={m.glyph} size={9} color={m.color} />
      {m.label}
    </span>
  );
}
