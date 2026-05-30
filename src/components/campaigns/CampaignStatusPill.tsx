import { Rune } from '@/components/ordo';

interface CampaignStatusPillProps {
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

const STATUS_MAP = {
  ACTIVE:    { label: 'Active',    color: '#7a9866', glyph: 'cir-dot' },
  PAUSED:    { label: 'Paused',    color: '#c9803a', glyph: 'cir' },
  COMPLETED: { label: 'Completed', color: 'var(--ink-faint)', glyph: 'check' },
};

export function CampaignStatusPill({ status }: CampaignStatusPillProps) {
  const m = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px 3px 7px', background: 'rgba(0,0,0,0.45)',
      border: `1px solid ${m.color}55`, borderLeft: `2px solid ${m.color}`,
      fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.16em',
      color: m.color, textTransform: 'uppercase',
    }}>
      <Rune kind={m.glyph} size={9} color={m.color} />{m.label}
    </span>
  );
}
