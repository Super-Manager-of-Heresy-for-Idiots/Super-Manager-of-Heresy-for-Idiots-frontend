import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { QuestStatus } from '@/types';
import s from './QuestStatusBadge.module.css';

const STATUS_MAP: Record<QuestStatus, { labelKey: string; color: string; glyph: string }> = {
  ACTIVE:    { labelKey: 'cmp.quest.ACTIVE',    color: '#d4b478', glyph: 'diamond-fill' },
  COMPLETED: { labelKey: 'cmp.quest.COMPLETED', color: '#6db86a', glyph: 'check' },
  FAILED:    { labelKey: 'cmp.quest.FAILED',    color: '#c87a3a', glyph: 'x' },
  HIDDEN:    { labelKey: 'cmp.quest.HIDDEN',    color: 'var(--ink-ghost)', glyph: 'lock' },
  ARCHIVED:  { labelKey: 'cmp.quest.ARCHIVED',  color: 'var(--ink-faint)', glyph: 'book' },
};

interface QuestStatusBadgeProps {
  status: QuestStatus;
}

export function QuestStatusBadge({ status }: QuestStatusBadgeProps) {
  const t = useT();
  const meta = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;

  return (
    <span className={s.badge} style={{ '--tone': meta.color } as CSSProperties}>
      <Rune kind={meta.glyph} size={8} color={meta.color} />
      {t(meta.labelKey)}
    </span>
  );
}
