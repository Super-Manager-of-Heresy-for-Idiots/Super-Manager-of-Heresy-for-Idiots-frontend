import type { CSSProperties } from 'react';
import { Link } from 'react-router-dom';
import { EmptyVault, OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import type { CampEventResponse, CampEventType } from '@/types';
import s from './CampEventLog.module.css';

const EVENT_VISUAL: Record<CampEventType, { tone: string; glyph: string }> = {
  AMBUSH:    { tone: 'var(--ember)',     glyph: 'sword' },
  ENCOUNTER: { tone: 'var(--gold)',      glyph: 'helm' },
  STORY:     { tone: 'var(--arcane)',    glyph: 'scroll' },
  WEATHER:   { tone: '#7fa8c4',          glyph: 'tri' },
  CUSTOM:    { tone: 'var(--ink-quiet)', glyph: 'diamond' },
};

interface CampEventLogProps {
  events: CampEventResponse[];
  isGm: boolean;
  busy?: boolean;
  onAdd: () => void;
  onTrigger: (eventId: string) => void;
  onDelete: (eventId: string) => void;
}

/**
 * Журнал привала. Скрытые заготовки мастера игрокам не приходят вовсе, поэтому
 * фильтровать их на клиенте не нужно — сервер уже отдал только видимые записи.
 */
export function CampEventLog({ events, isGm, busy, onAdd, onTrigger, onDelete }: CampEventLogProps) {
  const t = useT();

  return (
    <OrdoPanel padding={0} className={s.panel}>
      <PanelHeader
        title={t('campfire.log.title')}
        sub={t('campfire.log.sub', { count: events.length })}
        glyph="scroll"
        right={isGm ? (
          <button className="ao-btn ao-btn--sm" disabled={busy} onClick={onAdd}>
            <Rune kind="plus-sm" size={11} />
            {t('campfire.log.add')}
          </button>
        ) : undefined}
      />

      {events.length === 0 ? (
        <EmptyVault
          glyph="scroll"
          title={t('campfire.log.empty.title')}
          body={t('campfire.log.empty.body')}
        />
      ) : (
        <div className={s.list}>
          {events.map((event) => {
            const visual = EVENT_VISUAL[event.type];
            const draft = !event.triggeredAt;
            return (
              <div key={event.id} className={`${s.row} ${draft ? s.rowDraft : ''}`}>
                <span className={s.icon} style={{ '--tone': visual.tone } as CSSProperties}>
                  <Rune kind={visual.glyph} size={13} color={visual.tone} />
                </span>

                <div className={s.body}>
                  <div className={s.head}>
                    <span className={s.type} style={{ '--tone': visual.tone } as CSSProperties}>
                      {t(`campfire.event.${event.type}`)}
                    </span>
                    {event.occurredLabel && <span className="ao-codex">{event.occurredLabel}</span>}
                    {!event.visibleToPlayers && (
                      <span className={`ao-codex ${s.hidden}`}>{t('campfire.log.hidden')}</span>
                    )}
                  </div>

                  <div className={s.title}>{event.title}</div>
                  {event.description && <div className={s.text}>{event.description}</div>}

                  <div className={s.actions}>
                    {event.battleId && (
                      <Link className="ao-btn ao-btn--sm ao-btn--danger" to={`../battles/${event.battleId}/tactical`}>
                        <Rune kind="sword" size={11} />
                        {t('campfire.interrupt.toBattle')}
                      </Link>
                    )}
                    {isGm && draft && (
                      <button className="ao-btn ao-btn--sm" disabled={busy} onClick={() => onTrigger(event.id)}>
                        <Rune kind="arrow-r" size={11} />
                        {t('campfire.log.trigger')}
                      </button>
                    )}
                    {isGm && (
                      <button
                        className="ao-btn ao-btn--sm ao-btn--ghost"
                        disabled={busy}
                        onClick={() => onDelete(event.id)}
                      >
                        <Rune kind="minus" size={11} />
                        {t('campfire.log.delete')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </OrdoPanel>
  );
}
