import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './StatusControlPanel.module.css';

type StatusOption = 'ACTIVE' | 'DEAD' | 'RESERVE';

interface StatusControlPanelProps {
  characterId: string;
  currentStatus: string;
  onStatusChange: (status: string) => void;
}

interface StatusDef {
  status: StatusOption;
  descriptionKey: string;
  color: string;
}

const STATUS_OPTIONS: StatusDef[] = [
  {
    status: 'ACTIVE',
    descriptionKey: 'cmp.status.active',
    color: '#7a9866',
  },
  {
    status: 'DEAD',
    descriptionKey: 'cmp.status.dead',
    color: '#b06a6a',
  },
  {
    status: 'RESERVE',
    descriptionKey: 'cmp.status.reserve',
    color: 'var(--ink-faint)',
  },
];

export function StatusControlPanel({
  currentStatus,
  onStatusChange,
}: StatusControlPanelProps) {
  const t = useT();
  return (
    <OrdoPanel frame>
      <PanelHeader title={t('cmp.status.title')} glyph="sigil-1" />

      <div className={s.list}>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = currentStatus === opt.status;

          return (
            <button
              key={opt.status}
              onClick={() => onStatusChange(opt.status)}
              className={cn(s.opt, isSelected && s.selected)}
              style={{ '--opt': opt.color } as CSSProperties}
            >
              <div className={s.badge}>
                <CharStatusBadge status={opt.status} />
              </div>

              <div className={s.desc}>
                <div className={s.descText}>{t(opt.descriptionKey)}</div>
              </div>

              <div className={s.radio}>{isSelected && <div className={s.dot} />}</div>
            </button>
          );
        })}
      </div>
    </OrdoPanel>
  );
}
