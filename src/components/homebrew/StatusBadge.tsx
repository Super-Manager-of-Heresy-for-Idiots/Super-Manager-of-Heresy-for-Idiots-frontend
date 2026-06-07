import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

type BadgeStatus = 'DRAFT' | 'PUBLISHED' | 'UNPUBLISHED' | 'DELETED' | 'INSTALLED' | 'ARCHIVED';

interface StatusBadgeProps {
  status: BadgeStatus;
}

const STATUS_MAP: Record<BadgeStatus, { glyph: string; labelKey: string; stripe: string; text: string }> = {
  DRAFT:       { glyph: 'minus',        labelKey: 'cmp2.hbStatus.DRAFT',       stripe: '#3a322c',          text: 'var(--ink-quiet)' },
  PUBLISHED:   { glyph: 'diamond-fill', labelKey: 'cmp2.hbStatus.PUBLISHED',   stripe: 'var(--gold)',      text: 'var(--gold-pale)' },
  UNPUBLISHED: { glyph: 'lock',         labelKey: 'cmp2.hbStatus.UNPUBLISHED', stripe: 'var(--ink-quiet)',  text: 'var(--ink-quiet)' },
  DELETED:     { glyph: 'cross-pat',    labelKey: 'cmp2.hbStatus.DELETED',     stripe: 'var(--ember)',      text: '#d8896a' },
  INSTALLED:   { glyph: 'check',        labelKey: 'cmp2.hbStatus.INSTALLED',   stripe: 'var(--arcane)',     text: '#84c0c8' },
  ARCHIVED:    { glyph: 'lock',         labelKey: 'cmp2.hbStatus.ARCHIVED',    stripe: 'var(--ink-faint)',  text: 'var(--ink-faint)' },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const t = useT();
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
      {t(m.labelKey)}
    </span>
  );
}
