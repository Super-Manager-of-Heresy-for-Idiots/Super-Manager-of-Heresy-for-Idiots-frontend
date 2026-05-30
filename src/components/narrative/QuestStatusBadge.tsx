import { Rune } from '@/components/ordo';
import type { QuestStatus } from '@/types';

const STATUS_MAP: Record<QuestStatus, { label: string; color: string; glyph: string }> = {
  ACTIVE:    { label: 'Active',    color: '#d4b478', glyph: 'diamond-fill' },
  COMPLETED: { label: 'Completed', color: '#6db86a', glyph: 'check' },
  FAILED:    { label: 'Failed',    color: '#c87a3a', glyph: 'x' },
  HIDDEN:    { label: 'Hidden',    color: 'var(--ink-ghost)', glyph: 'lock' },
  ARCHIVED:  { label: 'Archived',  color: 'var(--ink-faint)', glyph: 'book' },
};

interface QuestStatusBadgeProps {
  status: QuestStatus;
}

export function QuestStatusBadge({ status }: QuestStatusBadgeProps) {
  const meta = STATUS_MAP[status] ?? STATUS_MAP.ACTIVE;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 7px 2px 6px',
        background: 'rgba(0,0,0,0.45)',
        border: `1px solid ${meta.color}`,
        borderLeft: `2px solid ${meta.color}`,
        fontFamily: 'var(--font-display)',
        fontSize: 9,
        letterSpacing: '0.2em',
        color: meta.color,
        textTransform: 'uppercase',
      }}
    >
      <Rune kind={meta.glyph} size={8} color={meta.color} />
      {meta.label}
    </span>
  );
}
