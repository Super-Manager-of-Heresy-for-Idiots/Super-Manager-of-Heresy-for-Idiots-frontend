import { Rune } from './Rune';
import { useT } from '@/i18n/I18nContext';

interface RoleBadgeProps {
  role: 'GAME_MASTER' | 'PLAYER' | 'ADMIN';
}

const ROLE_MAP = {
  GAME_MASTER: { labelKey: 'role.GAME_MASTER', glyph: 'eye' as const, color: 'var(--arcane)' },
  PLAYER: { labelKey: 'role.PLAYER', glyph: 'shield' as const, color: 'var(--gold)' },
  ADMIN: { labelKey: 'role.ADMIN', glyph: 'sigil-1' as const, color: 'var(--ember)' },
};

export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useT();
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
      {t(m.labelKey)}
    </span>
  );
}
