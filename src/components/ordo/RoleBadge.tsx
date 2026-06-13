import type { CSSProperties } from 'react';
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
    <span className="ao-rolebadge" style={{ '--role-color': m.color } as CSSProperties}>
      <Rune kind={m.glyph} size={9} color={m.color} />
      {t(m.labelKey)}
    </span>
  );
}
