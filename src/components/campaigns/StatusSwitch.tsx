import type { CampaignStatus } from '@/types';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import css from './StatusSwitch.module.css';

interface StatusSwitchProps {
  current: CampaignStatus;
  onChange: (status: CampaignStatus) => void;
}

const STATUSES: CampaignStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED'];

export function StatusSwitch({ current, onChange }: StatusSwitchProps) {
  const t = useT();
  return (
    <div className={css.switch}>
      {STATUSES.map((status) => (
        <button
          key={status}
          onClick={() => onChange(status)}
          className={cn(css.btn, status === current && css.on)}
        >
          {t(`cmp2.statusSwitch.${status}`)}
        </button>
      ))}
    </div>
  );
}
