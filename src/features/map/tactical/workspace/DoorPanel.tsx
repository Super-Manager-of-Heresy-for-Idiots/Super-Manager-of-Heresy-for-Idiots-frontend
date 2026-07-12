/**
 * GM doors (Phase 3.3): place an interactive door on the selected cell, then change its state
 * (open / closed / locked / secret). A closed/locked/secret door blocks passage — both in the
 * movement preview and on the server (map-service MovementValidator). Secret doors are hidden from
 * players (they see an invisible wall). Doors are session elements managed here by the GM; placement
 * uses the map's selected cell (click an empty cell first).
 */

import { useState } from 'react';
import toast from 'react-hot-toast';
import { useMapSessionStore, useMapTransientStore } from '../../state';
import { mapSessionApi } from '../../api';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import s from './workspace.module.css';

const STATES = ['CLOSED', 'OPEN', 'LOCKED', 'SECRET'] as const;
type DoorState = (typeof STATES)[number];

export function DoorPanel({ sessionId }: { sessionId: string }) {
  const t = useT();
  const mapElements = useMapSessionStore((st) => st.mapElements);
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const [state, setState] = useState<DoorState>('CLOSED');
  const [label, setLabel] = useState('');
  const [busy, setBusy] = useState(false);

  const doors = mapElements.filter(
    (el) => el.mapSessionId != null && (el.properties as Record<string, unknown>)?.door === true,
  );
  const prop = (el: (typeof doors)[number], key: string) => (el.properties as Record<string, unknown>)?.[key];

  const create = () => {
    if (!selectedCell || busy) return;
    setBusy(true);
    mapSessionApi
      .createDoor(sessionId, {
        gridX: selectedCell.gridX,
        gridY: selectedCell.gridY,
        state,
        label: label || undefined,
      })
      .then(() => setLabel(''))
      .catch(() => toast.error(t('tactical.door.failed')))
      .finally(() => setBusy(false));
  };

  const changeState = (elementId: string, next: DoorState) => {
    setBusy(true);
    mapSessionApi
      .setDoorState(sessionId, elementId, next)
      .catch(() => toast.error(t('tactical.door.failed')))
      .finally(() => setBusy(false));
  };

  const remove = (elementId: string) => {
    setBusy(true);
    mapSessionApi
      .deleteDoor(sessionId, elementId)
      .catch(() => toast.error(t('tactical.door.failed')))
      .finally(() => setBusy(false));
  };

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.door.title')}</div>
      <div className={s.hint}>
        {selectedCell
          ? t('tactical.door.cell', { x: selectedCell.gridX, y: selectedCell.gridY })
          : t('tactical.door.pickCell')}
      </div>
      <div className={cn('ao-col ao-gap-4', s.mt8)}>
        <div className="ao-row ao-gap-4 ao-wrap">
          <select
            className={cn('ao-input', s.sizeSelect)}
            value={state}
            onChange={(e) => setState(e.target.value as DoorState)}
          >
            {STATES.map((st) => (
              <option key={st} value={st}>
                {t(`tactical.door.state.${st}`)}
              </option>
            ))}
          </select>
          <input
            className={cn('ao-input', s.condSelect)}
            value={label}
            placeholder={t('tactical.door.label')}
            onChange={(e) => setLabel(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="ao-btn ao-btn--sm ao-btn--primary"
          disabled={!selectedCell || busy}
          onClick={create}
        >
          {t('tactical.door.create')}
        </button>
      </div>

      {doors.length > 0 && (
        <div className={cn('ao-col ao-gap-4', s.mt12)}>
          {doors.map((el) => (
            <div key={el.id} className="ao-row ao-between ao-gap-8">
              <span className={s.optName}>
                {(prop(el, 'label') as string) || t('tactical.door.title')} ·{' '}
                {t(`tactical.door.state.${(prop(el, 'state') as string) || 'CLOSED'}`)}
              </span>
              <div className="ao-row ao-gap-4">
                <select
                  className={cn('ao-input', s.sizeSelect)}
                  value={(prop(el, 'state') as string) || 'CLOSED'}
                  disabled={busy}
                  onChange={(e) => changeState(el.id, e.target.value as DoorState)}
                >
                  {STATES.map((st) => (
                    <option key={st} value={st}>
                      {t(`tactical.door.state.${st}`)}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--ghost"
                  disabled={busy}
                  onClick={() => remove(el.id)}
                >
                  {t('tactical.door.remove')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
