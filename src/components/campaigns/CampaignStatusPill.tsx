import type { CSSProperties } from 'react';
import { OrdoInterfaceIcon, type OrdoInterfaceIconKey } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import s from './CampaignStatusPill.module.css';

interface CampaignStatusPillProps {
  status: 'ACTIVE' | 'PAUSED' | 'COMPLETED';
}

const STATUS_MAP = {
  ACTIVE:    { labelKey: 'cmp2.campaignStatus.ACTIVE',    color: '#7a9866', icon: 'campaign-active' },
  PAUSED:    { labelKey: 'cmp2.campaignStatus.PAUSED',    color: '#c9803a', icon: 'campaign-paused' },
  COMPLETED: { labelKey: 'cmp2.campaignStatus.COMPLETED', color: 'var(--ink-faint)', icon: 'campaign-completed' },
} satisfies Record<CampaignStatusPillProps['status'], { labelKey: string; color: string; icon: OrdoInterfaceIconKey }>;

export function CampaignStatusPill({ status }: CampaignStatusPillProps) {
  const t = useT();
  const m = STATUS_MAP[status] || STATUS_MAP.ACTIVE;
  return (
    <span className={s.pill} style={{ '--tone': m.color } as CSSProperties}>
      <OrdoInterfaceIcon icon={m.icon} size={10} style={{ color: m.color }} />{t(m.labelKey)}
    </span>
  );
}
