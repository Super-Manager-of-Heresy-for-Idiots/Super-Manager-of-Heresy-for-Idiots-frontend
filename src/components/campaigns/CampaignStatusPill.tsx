import type { CSSProperties } from 'react';
import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import s from './CampaignStatusPill.module.css';

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
    <span className={s.pill} style={{ '--tone': m.color } as CSSProperties}>
      <Rune kind={m.glyph} size={9} color={m.color} />{t(m.labelKey)}
    </span>
  );
}
