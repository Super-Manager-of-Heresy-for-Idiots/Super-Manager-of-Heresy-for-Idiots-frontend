import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';

interface CampaignStatusPillProps {
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

const STATUS_MAP = {
  ACTIVE:    { labelKey: 'cmp2.campaignStatus.ACTIVE',    color: '#7a9866', glyph: 'cir-dot' },
  PAUSED:    { labelKey: 'cmp2.campaignStatus.PAUSED',    color: '#c9803a', glyph: 'cir' },
  COMPLETED: { labelKey: 'cmp2.campaignStatus.COMPLETED', color: 'var(--ink-faint)', glyph: 'check' },
};

export function CampaignStatusPill({ status }: CampaignStatusPillProps) {
  const t = useT();
  const m = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 9px 3px 7px', background: 'rgba(0,0,0,0.45)',
      border: `1px solid ${m.color}55`, borderLeft: `2px solid ${m.color}`,
      fontFamily: 'var(--font-display)', fontSize: 10, letterSpacing: '0.16em',
      color: m.color, textTransform: 'uppercase',
    }}>
      <Rune kind={m.glyph} size={9} color={m.color} />{t(m.labelKey)}
    </span>
  );
}
