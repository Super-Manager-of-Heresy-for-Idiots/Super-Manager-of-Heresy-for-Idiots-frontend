import type { CampaignStatus } from '@/types';

interface StatusSwitchProps {
  current: CampaignStatus;
  onChange: (status: CampaignStatus) => void;
}

const STATUSES: CampaignStatus[] = ['ACTIVE', 'PAUSED', 'COMPLETED'];

export function StatusSwitch({ current, onChange }: StatusSwitchProps) {
  return (
    <div style={{ display: 'flex', gap: 0, border: '1px solid var(--rule-strong)' }}>
      {STATUSES.map((s, i) => {
        const on = s === current;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            style={{
              flex: 1, padding: '9px 14px',
              fontFamily: 'var(--font-display)', fontSize: 11,
              letterSpacing: '0.16em', textTransform: 'uppercase',
              background: on ? 'rgba(176,141,78,0.12)' : 'transparent',
              color: on ? 'var(--gold-pale)' : 'var(--ink-faint)',
              border: 'none', borderLeft: i ? '1px solid var(--hairline)' : 'none',
              cursor: 'pointer',
            }}
          >
            {s}
          </button>
        );
      })}
    </div>
  );
}
