import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune, OrdoDivider } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { ResourceEntry } from '@/types';
import s from './ResourcesPanel.module.css';

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
        <div className={s.empty}>{t('cmp.resources.empty')}</div>
      ) : (
        <div className={s.list}>
          {resources.map((res, idx) => {
            const tone = res.color || DEFAULT_TONE;
            const hasMax = res.maxValue > 0;
            const pct = hasMax ? Math.min(100, (res.currentValue / res.maxValue) * 100) : 0;
            const atFloor = res.currentValue <= 0;
            const atCeil = hasMax && res.currentValue >= res.maxValue;

            return (
              <div key={res.id}>
                <div className={s.item} style={{ '--tone': tone } as CSSProperties}>
                  {/* Name + counter + controls */}
                  <div className={s.head}>
                    <Rune kind="sigil-2" size={11} color={tone} />
                    <span className={s.name}>{res.name}</span>

                    <span className={`ao-num ${s.count}`}>
                      {res.currentValue}
                      <span className={s.countMax}> / {res.maxValue}</span>
                    </span>

                    {editable && onModify && (
                      <div className={s.controls}>
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
      className="ao-stepbtn"
      style={{ '--step': '26px' } as CSSProperties}
    >
      <Rune kind={kind} size={9} color="var(--ink-quiet)" />
    </button>
  );
}
