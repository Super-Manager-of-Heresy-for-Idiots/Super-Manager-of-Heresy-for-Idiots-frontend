import type { CSSProperties } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { QuestStatus } from '@/types';
import s from './QuestStatusBadge.module.css';

const STATUS_MAP: Record<QuestStatus, { labelKey: string; color: string; icon: OrdoInterfaceIconKey }> = {
  ACTIVE:    { labelKey: 'cmp.quest.ACTIVE',    color: '#d4b478', icon: 'quest-active' },
  COMPLETED: { labelKey: 'cmp.quest.COMPLETED', color: '#6db86a', icon: 'quest-completed' },
  FAILED:    { labelKey: 'cmp.quest.FAILED',    color: '#c87a3a', icon: 'quest-failed' },
  HIDDEN:    { labelKey: 'cmp.quest.HIDDEN',    color: 'var(--ink-ghost)', icon: 'quest-hidden' },
  ARCHIVED:  { labelKey: 'cmp.quest.ARCHIVED',  color: 'var(--ink-faint)', icon: 'quest-archived' },
};

interface QuestStatusBadgeProps {
  status: QuestStatus;
}

export function QuestStatusBadge({ status }: QuestStatusBadgeProps) {
  const t = useT();
  const meta = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;

  return (
    <span className={s.badge} style={{ '--tone': meta.color } as CSSProperties}>
      <OrdoInterfaceIcon icon={meta.icon} size={10} style={{ color: meta.color }} />
      {t(meta.labelKey)}
    </span>
  );
}
