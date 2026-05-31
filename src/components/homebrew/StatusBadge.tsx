import { Rune } from '@/components/ordo';

type BadgeStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED' | 'INSTALLED' | 'ARCHIVED';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const STATUS_MAP: Record<BadgeStatus, { glyph: string; label: string; stripe: string; text: string }> = {
  DRAFT:       { glyph: 'minus',        label: 'DRAFT',    stripe: '#3a322c',          text: 'var(--ink-quiet)' },
  PUBLISHED:   { glyph: 'diamond-fill', label: 'SEALED',   stripe: 'var(--gold)',      text: 'var(--gold-pale)' },
  UNPUBLISHED: { glyph: 'lock',         label: 'WITHHELD', stripe: 'var(--ink-quiet)',  text: 'var(--ink-quiet)' },
  DELETED:     { glyph: 'cross-pat',    label: 'REDACTED', stripe: 'var(--ember)',      text: '#d8896a' },
  INSTALLED:   { glyph: 'check',        label: 'INSTATED', stripe: 'var(--arcane)',     text: '#84c0c8' },
  ARCHIVED:    { glyph: 'lock',         label: 'ARCHIVED', stripe: 'var(--ink-faint)',  text: 'var(--ink-faint)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const m = STATUS_MAP[status] || STATUS_MAP.DRAFT;
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: 6,
      padding: '4px 9px 4px 6px',
      background: 'rgba(0,0,0,0.5)',
      border: '1px solid var(--rule-strong)',
      borderLeft: `2px solid ${m.stripe}`,
      fontFamily: 'var(--font-display)',
      fontSize: 10,
      letterSpacing: '0.22em',
      color: m.text,
      textTransform: 'uppercase',
    }}>
      <Rune kind={m.glyph} size={9} color={m.stripe} />
      {m.label}
    </span>
  );
}
