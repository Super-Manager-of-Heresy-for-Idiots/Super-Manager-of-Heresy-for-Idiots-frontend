import { useState } from 'react';
import { OrdoPanel, PanelHeader, Rune } from '@/components/ordo';
import { useUpdateWatchOrder } from '@/hooks/useCamp';
import { useT } from '@/i18n/I18nContext';
import type { CampSessionResponse, CampWatchSlotRequest } from '@/types';
import s from './CampWatchPanel.module.css';

interface CampWatchPanelProps {
  campaignId: string;
  camp: CampSessionResponse;
  isGm: boolean;
  /** Открывает запрос проверки дозорному (ROLL_PROMPT). */
  onRequestCheck: (characterId: string, slot: number) => void;
}

/**
 * Порядок дозора: расписание слотов и назначенные персонажи. Мастер переставляет
 * дозор перетаскиванием — расписание отправляется целиком, как того требует API.
 */
export function CampWatchPanel({ campaignId, camp, isGm, onRequestCheck }: CampWatchPanelProps) {
  const t = useT();
  const updateWatchOrder = useUpdateWatchOrder();
  const [dragging, setDragging] = useState<string | null>(null);

  const assignedIds = camp.watchSchedule
    .map((slot) => slot.characterId)
    .filter((id): id is string => !!id);
  const unassigned = camp.participants.filter(
    (participant) => !assignedIds.includes(participant.characterId),
  );
  const filled = assignedIds.length;

  const assign = (slot: number, characterId: string) => {
    const schedule: CampWatchSlotRequest[] = camp.watchSchedule.map((entry) => ({
      slot: entry.slot,
      label: entry.label,
      // Персонаж занимает ровно один слот: из прежнего он снимается.
      characterId: entry.slot === slot
        ? characterId
        : entry.characterId === characterId ? null : entry.characterId ?? null,
    }));

    updateWatchOrder.mutate({
      campaignId,
      campId: camp.id,
      data: { watchSlotCount: camp.watchSlotCount, watchSchedule: schedule },
    });
  };

  const clear = (slot: number) => {
    const schedule: CampWatchSlotRequest[] = camp.watchSchedule.map((entry) => ({
      slot: entry.slot,
      label: entry.label,
      characterId: entry.slot === slot ? null : entry.characterId ?? null,
    }));
    updateWatchOrder.mutate({
      campaignId,
      campId: camp.id,
      data: { watchSlotCount: camp.watchSlotCount, watchSchedule: schedule },
    });
  };

  return (
    <OrdoPanel padding={0} className={s.panel}>
      <PanelHeader
        title={t('campfire.watch.title')}
        sub={t('campfire.watch.sub', { count: camp.watchSlotCount })}
        glyph="eye"
        right={(
          <span className="ao-codex">
            {t('campfire.watch.filled', { filled, total: camp.watchSlotCount })}
          </span>
        )}
      />

      <div className={s.slots}>
        {camp.watchSchedule.length === 0 && (
          <span className={`ao-italic ${s.quiet}`}>{t('campfire.watch.noSlots')}</span>
        )}

        {camp.watchSchedule.map((slot) => (
          <div
            key={slot.slot}
            className={`${s.slot} ${slot.characterId ? s.slotFilled : ''} ${dragging && !slot.characterId ? s.slotTarget : ''}`}
            onDragOver={(event) => {
              if (isGm && dragging) event.preventDefault();
            }}
            onDrop={() => {
              if (isGm && dragging) {
                assign(slot.slot, dragging);
                setDragging(null);
              }
            }}
          >
            <span className={`ao-num ${s.slotNumber}`}>{slot.slot}</span>

            {slot.characterId ? (
              <>
                <div
                  className={s.slotBody}
                  draggable={isGm}
                  onDragStart={() => setDragging(slot.characterId!)}
                  onDragEnd={() => setDragging(null)}
                >
                  <span className={s.slotName}>{slot.characterName}</span>
                  {slot.label && <span className="ao-codex">{slot.label}</span>}
                </div>
                {isGm && (
                  <div className={s.slotActions}>
                    <button
                      className="ao-btn ao-btn--sm"
                      disabled={updateWatchOrder.isPending}
                      onClick={() => onRequestCheck(slot.characterId!, slot.slot)}
                    >
                      <Rune kind="hex" size={11} />
                      {t('campfire.watch.check')}
                    </button>
                    <button
                      className="ao-iconbtn"
                      title={t('campfire.watch.clear')}
                      disabled={updateWatchOrder.isPending}
                      onClick={() => clear(slot.slot)}
                    >
                      <Rune kind="minus" size={11} />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className={s.slotEmpty}>
                <span className={`ao-italic ${s.quiet}`}>
                  {t('campfire.watch.emptySlot')}
                  {slot.label ? ` · ${slot.label}` : ''}
                </span>
                {isGm && <span className="ao-codex">{t('campfire.watch.dropHere')}</span>}
              </div>
            )}
          </div>
        ))}
      </div>

      {isGm && camp.watchSlotCount > 0 && (
        <div className={s.bench}>
          <div className="ao-overline">{t('campfire.watch.unassigned')}</div>
          {unassigned.length === 0 ? (
            <span className={`ao-italic ${s.quiet}`}>{t('campfire.watch.allAssigned')}</span>
          ) : (
            <div className={s.benchList}>
              {unassigned.map((participant) => (
                <span
                  key={participant.id}
                  className={`${s.chip} ${dragging === participant.characterId ? s.chipDragging : ''}`}
                  draggable
                  onDragStart={() => setDragging(participant.characterId)}
                  onDragEnd={() => setDragging(null)}
                >
                  <Rune kind="helm" size={11} color="var(--ink-quiet)" />
                  {participant.characterName}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </OrdoPanel>
  );
}
