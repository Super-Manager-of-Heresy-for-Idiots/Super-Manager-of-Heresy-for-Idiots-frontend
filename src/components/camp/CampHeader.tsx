import { Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampSessionResponse } from '@/types';
import { CampSafetyBadge, CampStatusBadge } from './CampBadges';
import { CampStatusTimeline } from './CampStatusTimeline';
import s from './CampHeader.module.css';

interface CampHeaderProps {
  camp: CampSessionResponse;
  isGm: boolean;
  busy?: boolean;
  onStart: () => void;
  onStartRest: (restType: 'long' | 'short') => void;
  onInterrupt: () => void;
  onEnd: () => void;
}

/**
 * Шапка привала: название, локация с меткой безопасности, таймлайн статусов и
 * действия мастера. Кнопки строятся из `availableTransitions`, поэтому недопустимых
 * действий на экране не появляется.
 */
export function CampHeader({
  camp,
  isGm,
  busy,
  onStart,
  onStartRest,
  onInterrupt,
  onEnd,
}: CampHeaderProps) {
  const t = useT();
  const can = (status: CampSessionResponse['status']) => camp.availableTransitions.includes(status);
  const hasTransitions = camp.availableTransitions.length > 0;
  const safetyHint = camp.restSafety && camp.restSafety !== 'SAFE'
    ? t(`campfire.safety.hint.${camp.restSafety}`)
    : null;

  return (
    <div className={`ao-panel ${s.head}`}>
      <div className={s.top}>
        <div className={s.identity}>
          <div className={s.overline}>
            <Rune kind="flame" size={15} color="var(--gold)" />
            <span className="ao-overline">
              {camp.dayNumber != null
                ? t('campfire.overlineDay', { day: camp.dayNumber })
                : t('campfire.overline')}
            </span>
          </div>
          <h4 className="ao-h4">{camp.name}</h4>
          <div className={s.place}>
            <span className={s.location}>
              <Rune kind="diamond" size={9} color="var(--bronze-warm)" />
              {camp.location?.name ?? t('campfire.inTransit')}
            </span>
            {camp.restSafety && <CampSafetyBadge level={camp.restSafety} />}
          </div>
          {camp.description && <p className={`ao-italic ${s.description}`}>{camp.description}</p>}
        </div>

        <div className={s.timeline}>
          <CampStatusTimeline status={camp.status} visited={camp.visitedStatuses} />
        </div>

        <div className={s.controls} data-testid="camp-status" data-status={camp.status}>
          <CampStatusBadge
            status={camp.status}
            size="lg"
            pulse={camp.status === 'RESTING' || camp.status === 'INTERRUPTED'}
          />

          {isGm ? (
            <div className={s.actions}>
              {!hasTransitions && (
                <span className={`ao-italic ${s.quiet}`}>{t('campfire.noTransitions')}</span>
              )}
              {can('ACTIVE') && (
                <button
                  className="ao-btn ao-btn--primary"
                  data-testid="camp-action-start"
                  disabled={busy}
                  onClick={onStart}
                >
                  {t(camp.status === 'INTERRUPTED'
                    ? 'campfire.action.ACTIVE.fromInterrupted'
                    : 'campfire.action.ACTIVE')}
                </button>
              )}
              {can('RESTING') && (
                <>
                  <button
                    className="ao-btn ao-btn--primary"
                    data-testid="camp-action-rest-long"
                    disabled={busy}
                    onClick={() => onStartRest('long')}
                  >
                    {t('campfire.restPanel.long')}
                  </button>
                  <button
                    className="ao-btn"
                    data-testid="camp-action-rest-short"
                    disabled={busy}
                    onClick={() => onStartRest('short')}
                  >
                    {t('campfire.restPanel.short')}
                  </button>
                </>
              )}
              {can('INTERRUPTED') && (
                <button
                  className="ao-btn ao-btn--danger"
                  data-testid="camp-action-interrupt"
                  disabled={busy}
                  onClick={onInterrupt}
                >
                  {t('campfire.action.INTERRUPTED')}
                </button>
              )}
              {can('COMPLETED') && (
                <button
                  className="ao-btn ao-btn--ghost"
                  data-testid="camp-action-end"
                  disabled={busy}
                  onClick={onEnd}
                >
                  {t('campfire.action.COMPLETED')}
                </button>
              )}
            </div>
          ) : (
            <span className={`ao-italic ${s.quiet}`} data-testid="camp-gm-only">
              {t('campfire.gmOnly')}
            </span>
          )}
        </div>
      </div>

      {isGm && safetyHint && (
        <div className={s.hintRow}>
          <div className={`${s.hint} ${camp.restSafety === 'DANGEROUS' ? s.hintEmber : ''}`}>
            <Rune
              kind={camp.restSafety === 'DANGEROUS' ? 'sword' : 'eye'}
              size={14}
              color={camp.restSafety === 'DANGEROUS' ? '#d8896a' : 'var(--gold-pale)'}
            />
            <span className="ao-italic">{safetyHint}</span>
          </div>
        </div>
      )}
    </div>
  );
}
