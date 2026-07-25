import { Link } from 'react-router-dom';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampSessionResponse } from '@/types';
import s from './CampInterruptPanel.module.css';

interface CampInterruptPanelProps {
  camp: CampSessionResponse;
  isGm: boolean;
  busy?: boolean;
  onApplyPartialRest: () => void;
}

/**
 * Баннер прерывания и решение мастера о частичном отдыхе. По умолчанию прерванный
 * привал восстановления не даёт — частичный отдых применяется как короткий привал.
 */
export function CampInterruptPanel({ camp, isGm, busy, onApplyPartialRest }: CampInterruptPanelProps) {
  const t = useT();
  const reason = camp.interruptReason ?? 'MANUAL';
  const eligible = camp.participants.filter(
    (participant) => participant.state !== 'PARTIAL' && participant.state !== 'RESTED',
  );

  return (
    <div className={s.wrap}>
      <div className={s.banner}>
        <Rune kind="sword" size={22} color="#d8896a" />
        <div className={s.bannerBody}>
          <div className={s.bannerTitle}>{t(`campfire.interrupt.banner.${reason}`)}</div>
          <div className={s.bannerText}>{t('campfire.interrupt.body')}</div>
        </div>
        {camp.interruptBattleId && (
          <Link className="ao-btn ao-btn--danger" to={`../battles/${camp.interruptBattleId}/tactical`}>
            <Rune kind="sword" size={12} />
            {t('campfire.interrupt.toBattle')}
          </Link>
        )}
      </div>

      <OrdoPanel padding={0} className={camp.applyPartialRest ? s.decisionOn : undefined}>
        <PanelHeader title={t('campfire.interrupt.decision')} glyph="scroll" />
        <div className={s.decisionBody}>
          {isGm ? (
            <>
              <p className={`ao-italic ${s.hint}`}>{t('campfire.interrupt.partialHint')}</p>
              <div className={s.decisionActions}>
                <button
                  className="ao-btn ao-btn--primary"
                  disabled={busy || eligible.length === 0}
                  onClick={onApplyPartialRest}
                >
                  <Rune kind="check" size={12} />
                  {t('campfire.interrupt.partialApply', { count: eligible.length })}
                </button>
              </div>
              <p className={`ao-italic ${s.warning}`}>{t('campfire.interrupt.irreversible')}</p>
            </>
          ) : (
            <div className={s.playerNote}>
              <Rune
                kind={camp.applyPartialRest ? 'check' : 'minus'}
                size={14}
                color={camp.applyPartialRest ? 'var(--gold-pale)' : 'var(--ink-faint)'}
              />
              <span className="ao-italic">
                {t(camp.applyPartialRest
                  ? 'campfire.interrupt.partialApplied'
                  : 'campfire.interrupt.partialPending')}
              </span>
            </div>
          )}
        </div>
      </OrdoPanel>
    </div>
  );
}
