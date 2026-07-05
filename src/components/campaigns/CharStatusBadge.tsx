import type { CSSProperties } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import s from './CharStatusBadge.module.css';

interface CharStatusBadgeProps {
  status: string;
}

const MAP = {
  ACTIVE:  { labelKey: 'cmp2.charStatus.ACTIVE',  color: '#7a9866', icon: 'character-active' },
  DEAD:    { labelKey: 'cmp2.charStatus.DEAD',    color: '#b06a6a', icon: 'character-dead' },
  RESERVE: { labelKey: 'cmp2.charStatus.RESERVE', color: 'var(--ink-faint)', icon: 'character-reserve' },
  DOWN:    { labelKey: 'cmp2.charStatus.DOWN',    color: '#c9803a', icon: 'downed' },
} satisfies Record<string, { labelKey: string; color: string; icon: OrdoInterfaceIconKey }>;

export function CharStatusBadge({ status }: CharStatusBadgeProps) {
  const t = useT();
  const m = MAP[status as keyof typeof MAP] || MAP.ACTIVE;
  return (
    <span className={s.badge} style={{ '--tone': m.color } as CSSProperties}>
      <OrdoInterfaceIcon icon={m.icon} size={10} style={{ color: m.color }} />{t(m.labelKey)}
    </span>
  );
}
