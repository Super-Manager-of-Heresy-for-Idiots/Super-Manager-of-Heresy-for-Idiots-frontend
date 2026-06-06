import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { CharStatusBadge } from '@/components/campaigns';
import { useT } from '@/i18n/I18nContext';

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

      <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {STATUS_OPTIONS.map((opt) => {
          const isSelected = currentStatus === opt.status;

          return (
            <button
              key={opt.status}
              onClick={() => onStatusChange(opt.status)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px 14px',
                background: isSelected
                  ? `${opt.color}14`
                  : 'transparent',
                border: `1px solid ${isSelected ? `${opt.color}44` : 'var(--rule)'}`,
                cursor: 'pointer',
                textAlign: 'left',
                width: '100%',
                transition: 'background 0.15s, border-color 0.15s',
              }}
            >
              {/* Badge */}
              <div style={{ flexShrink: 0 }}>
                <CharStatusBadge status={opt.status} />
              </div>

              {/* Description */}
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--ink-quiet)',
                    lineHeight: 1.4,
                  }}
                >
                  {t(opt.descriptionKey)}
                </div>
              </div>

              {/* Radio indicator */}
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  border: `2px solid ${isSelected ? opt.color : 'var(--rule)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: opt.color,
                    }}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </OrdoPanel>
  );
}
