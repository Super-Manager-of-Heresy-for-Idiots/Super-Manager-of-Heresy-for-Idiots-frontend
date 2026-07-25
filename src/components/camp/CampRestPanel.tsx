import type { CSSProperties } from 'react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampSessionResponse } from '@/types';
import s from './CampRestPanel.module.css';

interface CampRestPanelProps {
  camp: CampSessionResponse;
  isGm: boolean;
  busy?: boolean;
  onApply: () => void;
  onRetry: (characterIds: string[]) => void;
}

/**
 * Ход и итоги группового отдыха. Отдых применяется per-character, поэтому успешные
 * результаты и ошибки живут рядом: ошибки собраны отдельным списком с точечным повтором.
 */
export function CampRestPanel({ camp, isGm, busy, onApply, onRetry }: CampRestPanelProps) {
  const t = useT();
  const participants = camp.participants;
  const rested = participants.filter((p) => p.state === 'RESTED' || p.state === 'PARTIAL');
  const failed = participants.filter((p) => p.state === 'FAILED');
  const pending = participants.filter((p) => p.state === 'RESTING' || p.state === 'NOT_RESTED');
  const total = Math.max(participants.length, 1);
  const restLabel = camp.restType
    ? t(`campfire.restPanel.type.${camp.restType}`)
    : t('campfire.restPanel.title');

  return (
    <div className={s.wrap}>
      <div className={`ao-panel ${s.progressPanel}`}>
        <span className={s.restType}>
          <Rune kind="cir-dot" size={15} color="var(--arcane)" />
          <span className="ao-engraved">{restLabel}</span>
        </span>

        <div className={s.progressBody}>
          <div className={s.progressTop}>
            <span className="ao-overline">{t('campfire.restPanel.perCharacter')}</span>
            <span className="ao-codex">
              {t('campfire.restPanel.counters', {
                rested: rested.length,
                pending: pending.length,
                failed: failed.length,
              })}
            </span>
          </div>
          <div className={s.bar}>
            <span
              className={s.barRested}
              style={{ '--fill': `${(rested.length / total) * 100}%` } as CSSProperties}
            />
            <span
              className={s.barPending}
              style={{ '--fill': `${(pending.length / total) * 100}%` } as CSSProperties}
            />
            <span
              className={s.barFailed}
              style={{ '--fill': `${(failed.length / total) * 100}%` } as CSSProperties}
            />
          </div>
        </div>

        {isGm && (
          <div className={s.progressActions}>
            {failed.length > 0 && (
              <button
                className="ao-btn ao-btn--sm"
                data-testid="camp-rest-retry"
                disabled={busy}
                onClick={() => onRetry(failed.map((p) => p.characterId))}
              >
                <Rune kind="arrow-r" size={11} />
                {t('campfire.restPanel.retry', { count: failed.length })}
              </button>
            )}
            <button
              className="ao-btn ao-btn--sm ao-btn--primary"
              data-testid="camp-rest-apply"
              disabled={busy || pending.length === 0}
              onClick={onApply}
            >
              <Rune kind="check" size={11} />
              {busy ? t('campfire.restPanel.applying') : t('campfire.restPanel.apply')}
            </button>
          </div>
        )}
      </div>

      <div className={s.columns}>
        <OrdoPanel padding={0} className={s.column}>
          <PanelHeader
            title={t('campfire.restPanel.results')}
            glyph="check"
            right={<span className="ao-codex">{rested.length}</span>}
          />
          <div className={s.list}>
            {rested.length === 0 ? (
              <span className={`ao-italic ${s.quiet}`}>{t('campfire.restPanel.resultsEmpty')}</span>
            ) : (
              rested.map((participant) => (
                <div key={participant.id} className={s.result}>
                  <div className={s.resultHead}>
                    <span className={s.resultName}>{participant.characterName}</span>
                    {participant.state === 'PARTIAL' && (
                      <span className="ao-codex">{t('campfire.rest.PARTIAL')}</span>
                    )}
                  </div>
                  <div className={s.resultLines}>
                    {participant.restResult?.hp && (
                      <span className={s.resultLine}>
                        <Rune kind="check" size={9} color="#7a9866" />
                        {t('campfire.restPanel.hpRestored', {
                          current: participant.restResult.hp.currentHp,
                          max: participant.restResult.hp.maxHp,
                        })}
                      </span>
                    )}
                    {participant.restResult?.spellSlots && (
                      <span className={s.resultLine}>
                        <Rune kind="check" size={9} color="#7a9866" />
                        {t('campfire.restPanel.slotsRestored')}
                      </span>
                    )}
                    {!!participant.restResult?.resources?.length && (
                      <span className={s.resultLine}>
                        <Rune kind="check" size={9} color="#7a9866" />
                        {t('campfire.restPanel.resourcesRestored', {
                          count: participant.restResult.resources.length,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </OrdoPanel>

        <OrdoPanel padding={0} className={`${s.column} ${failed.length ? s.columnFailed : ''}`}>
          <PanelHeader
            title={t('campfire.restPanel.errors')}
            sub={t('campfire.restPanel.errorsSub')}
            glyph="tri-inv"
            tone={failed.length ? 'ember' : 'gold'}
            right={<span className="ao-codex">{failed.length}</span>}
          />
          <div className={s.list}>
            {failed.length === 0 ? (
              <span className={s.okRow}>
                <Rune kind="check" size={13} color="#7a9866" />
                <span className={`ao-italic ${s.quiet}`}>{t('campfire.restPanel.noErrors')}</span>
              </span>
            ) : (
              <>
                {failed.map((participant) => (
                  <div key={participant.id} className={s.failure}>
                    <div className={s.failureHead}>
                      <Rune kind="x" size={12} color="#d8896a" />
                      <span className={s.resultName}>{participant.characterName}</span>
                      <span className={`ao-codex ${s.failureCode}`}>{participant.restErrorCode}</span>
                    </div>
                    <div className={s.failureText}>
                      {participant.restErrorMessage
                        || t(`campfire.restError.${participant.restErrorCode}`)}
                    </div>
                    {isGm && (
                      <button
                        className="ao-btn ao-btn--sm"
                        disabled={busy}
                        onClick={() => onRetry([participant.characterId])}
                      >
                        <Rune kind="arrow-r" size={11} />
                        {t('campfire.restPanel.retry', { count: 1 })}
                      </button>
                    )}
                  </div>
                ))}
                {isGm && (
                  <p className={`ao-italic ${s.quiet}`}>{t('campfire.restPanel.errorsHint')}</p>
                )}
              </>
            )}
          </div>
        </OrdoPanel>
      </div>
    </div>
  );
}
