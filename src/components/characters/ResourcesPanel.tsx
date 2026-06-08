import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { ResourceEntry } from '@/types';

interface ResourcesPanelProps {
  resources: ResourceEntry[];
  /** When false, Spend/Restore controls are hidden (read-only view). */
  editable?: boolean;
  /** Apply a signed change to a resource: `-1` spends, `+1` restores. */
  onModify?: (resourceId: string, delta: number) => void;
  /** A mutation is in flight — disables controls to avoid double-submits. */
  pending?: boolean;
}

const DEFAULT_TONE = 'var(--arcane)';

export function ResourcesPanel({
  resources,
  editable = false,
  onModify,
  pending = false,
}: ResourcesPanelProps) {
  const t = useT();

  return (
    <OrdoPanel frame padding={0}>
      <PanelHeader title={t('cmp.resources.title')} glyph="hex" tone="arcane" />

      {resources.length === 0 ? (
        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--ink-faint)',
            fontSize: 12,
            fontStyle: 'italic',
          }}
        >
          {t('cmp.resources.empty')}
        </div>
      ) : (
        <div style={{ padding: 16 }}>
          {resources.map((res, idx) => {
            const tone = res.color || DEFAULT_TONE;
            const hasMax = res.maxValue > 0;
            const pct = hasMax ? Math.min(100, (res.currentValue / res.maxValue) * 100) : 0;
            const atFloor = res.currentValue <= 0;
            const atCeil = hasMax && res.currentValue >= res.maxValue;

            return (
              <div key={res.id}>
                <div style={{ padding: '11px 0' }}>
                  {/* Name + counter + controls */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Rune kind="sigil-2" size={11} color={tone} />
                    <span
                      style={{
                        flex: 1,
                        fontSize: 13.5,
                        fontFamily: 'var(--font-display)',
                        color: 'var(--ink-bright)',
                        letterSpacing: '0.04em',
                      }}
                    >
                      {res.name}
                    </span>

                    <span className="ao-num" style={{ fontSize: 14, color: tone }}>
                      {res.currentValue}
                      <span style={{ color: 'var(--ink-faint)' }}> / {res.maxValue}</span>
                    </span>

                    {editable && onModify && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4 }}>
                        <StepButton
                          kind="minus"
                          label={t('cmp.resources.spend', { name: res.name })}
                          disabled={pending || atFloor}
                          onClick={() => onModify(res.id, -1)}
                        />
                        <StepButton
                          kind="plus"
                          label={t('cmp.resources.restore', { name: res.name })}
                          disabled={pending || atCeil}
                          onClick={() => onModify(res.id, 1)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Fill bar (tinted by the resource colour) */}
                  <div className="ao-bar">
                    <div
                      className="ao-bar-fill"
                      style={{ width: `${pct}%`, background: tone }}
                    />
                  </div>
                </div>

                {idx < resources.length - 1 && <OrdoDivider glyph="hex" color="var(--rule)" />}
              </div>
            );
          })}
        </div>
      )}
    </OrdoPanel>
  );
}

interface StepButtonProps {
  kind: 'plus' | 'minus';
  label: string;
  disabled: boolean;
  onClick: () => void;
}

function StepButton({ kind, label, disabled, onClick }: StepButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      style={{
        width: 26,
        height: 26,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'var(--abyss)',
        border: '1px solid var(--rule)',
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.35 : 1,
      }}
    >
      <Rune kind={kind} size={9} color="var(--ink-quiet)" />
    </button>
  );
}
