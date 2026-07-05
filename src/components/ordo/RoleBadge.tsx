import type { CSSProperties } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from './OrdoInterfaceIcon';
import { useT } from '@/i18n/I18nContext';

interface RoleBadgeProps {
  role: 'GAME_MASTER' | 'PLAYER' | 'ADMIN';
}

const ROLE_MAP = {
  GAME_MASTER: { labelKey: 'role.GAME_MASTER', icon: 'role-game-master', color: 'var(--arcane)' },
  PLAYER: { labelKey: 'role.PLAYER', icon: 'role-player', color: 'var(--gold)' },
  ADMIN: { labelKey: 'role.ADMIN', icon: 'role-admin', color: 'var(--ember)' },
} satisfies Record<RoleBadgeProps['role'], { labelKey: string; icon: OrdoInterfaceIconKey; color: string }>;

export function RoleBadge({ role }: RoleBadgeProps) {
  const t = useT();
  const m = ROLE_MAP[role] || ROLE_MAP.PLAYER;
  return (
    <span className="ao-rolebadge" style={{ '--role-color': m.color } as CSSProperties}>
      <OrdoInterfaceIcon icon={m.icon} size={10} style={{ color: m.color }} />
      {t(m.labelKey)}
    </span>
  );
}
