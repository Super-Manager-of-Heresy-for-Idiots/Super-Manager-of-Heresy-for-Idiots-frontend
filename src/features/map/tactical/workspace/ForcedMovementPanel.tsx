/**
 * GM forced movement & teleport (Phase 2.12). Pick a destination by clicking an empty cell on the
 * map (it becomes the "selected cell"), then push/pull/slide a target there, or teleport a combatant —
 * optionally bringing nearby allies, who land on the cells around the destination. Positions come from
 * the placed tokens; the core validates and the map executes the move (marked forced/teleport).
 */

import { useMemo, useState } from 'react';
import { useForcedMove, useTeleport } from '@/hooks/useBattles';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import type { BattleResponse, ForcedMoveType } from '@/types';
import { useMapTransientStore } from '../../state';
import type { TacticalTokenView } from '../tacticalView';
import { combatantLabel } from './combat';
import s from './workspace.module.css';

const FORCED_TYPES: ForcedMoveType[] = ['PUSH', 'PULL', 'SLIDE'];
// Ring of offsets around the destination for allies brought along by a teleport.
const ALLY_OFFSETS: ReadonlyArray<readonly [number, number]> = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
];

export function ForcedMovementPanel({
  campaignId,
  battle,
  tacticalTokens,
}: {
  campaignId: string;
  battle: BattleResponse;
  tacticalTokens: TacticalTokenView[];
}) {
  const t = useT();
  const forced = useForcedMove();
  const teleport = useTeleport();
  const selectedCell = useMapTransientStore((st) => st.selectedCell);
  const [mode, setMode] = useState<'FORCED' | 'TELEPORT'>('FORCED');
  const [targetId, setTargetId] = useState('');
  const [teleporterId, setTeleporterId] = useState('');
  const [allyIds, setAllyIds] = useState<Set<string>>(new Set());

  const alive = useMemo(
    () => battle.combatants.filter((c) => c.currentHp == null || c.currentHp > 0),
    [battle.combatants],
  );
  const pos = (combatantId: string) => {
    const tk = tacticalTokens.find((v) => v.linkedCombatantId === combatantId);
    return tk ? { col: Math.round(tk.gridX), row: Math.round(tk.gridY) } : null;
  };
  const busy = forced.isPending || teleport.isPending;
  const hasCell = !!selectedCell;

  const doForced = (type: ForcedMoveType) => {
    if (!targetId || !selectedCell) return;
    const from = pos(targetId);
    forced.mutate({
      campaignId,
      battleId: battle.id,
      data: {
        type,
        targetCombatantId: targetId,
        toCol: selectedCell.gridX,
        toRow: selectedCell.gridY,
        ...(from ? { fromCol: from.col, fromRow: from.row } : {}),
      },
    });
  };

  const doTeleport = () => {
    if (!teleporterId || !selectedCell) return;
    const from = pos(teleporterId);
    const allies = [...allyIds].map((id, i) => {
      const [dx, dy] = ALLY_OFFSETS[i % ALLY_OFFSETS.length];
      const af = pos(id);
      return {
        combatantId: id,
        toCol: selectedCell.gridX + dx,
        toRow: selectedCell.gridY + dy,
        ...(af ? { fromCol: af.col, fromRow: af.row } : {}),
      };
    });
    teleport.mutate({
      campaignId,
      battleId: battle.id,
      data: {
        combatantId: teleporterId,
        toCol: selectedCell.gridX,
        toRow: selectedCell.gridY,
        ...(from ? { fromCol: from.col, fromRow: from.row } : {}),
        ...(allies.length ? { allies } : {}),
      },
    });
    setAllyIds(new Set());
  };

  const toggleAlly = (id: string) =>
    setAllyIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className={s.block}>
      <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.forced.title')}</div>
      <div className="ao-row ao-gap-4 ao-wrap">
        <button
          type="button"
          className={cn('ao-btn ao-btn--sm', mode === 'FORCED' ? 'ao-btn--primary' : 'ao-btn--ghost')}
          onClick={() => setMode('FORCED')}
        >
          {t('tactical.forced.forcedTab')}
        </button>
        <button
          type="button"
          className={cn('ao-btn ao-btn--sm', mode === 'TELEPORT' ? 'ao-btn--primary' : 'ao-btn--ghost')}
          onClick={() => setMode('TELEPORT')}
        >
          {t('tactical.forced.teleportTab')}
        </button>
      </div>
      <div className={cn(s.hint, s.mt8)}>
        {hasCell ? t('tactical.forced.cell', { x: selectedCell!.gridX, y: selectedCell!.gridY }) : t('tactical.forced.pickCell')}
      </div>

      {mode === 'FORCED' && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <select className={cn('ao-input', s.condSelect)} value={targetId} onChange={(e) => setTargetId(e.target.value)}>
            <option value="">{t('tactical.forced.pickTarget')}</option>
            {alive.map((c) => (
              <option key={c.id} value={c.id}>
                {combatantLabel(c, true)}
              </option>
            ))}
          </select>
          <div className="ao-row ao-gap-4 ao-wrap">
            {FORCED_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                className="ao-btn ao-btn--sm ao-btn--danger"
                disabled={!targetId || !hasCell || busy}
                onClick={() => doForced(type)}
              >
                {t(`tactical.forced.${type}`)}
              </button>
            ))}
          </div>
        </div>
      )}

      {mode === 'TELEPORT' && (
        <div className={cn('ao-col ao-gap-4', s.mt8)}>
          <select
            className={cn('ao-input', s.condSelect)}
            value={teleporterId}
            onChange={(e) => setTeleporterId(e.target.value)}
          >
            <option value="">{t('tactical.forced.pickTeleporter')}</option>
            {alive.map((c) => (
              <option key={c.id} value={c.id}>
                {combatantLabel(c, true)}
              </option>
            ))}
          </select>
          {teleporterId && (
            <>
              <div className={cn('ao-overline', s.fieldLabel)}>{t('tactical.forced.allies')}</div>
              <div className={s.optGrid}>
                {alive
                  .filter((c) => c.id !== teleporterId)
                  .map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className={cn(s.optBtn, allyIds.has(c.id) && s.optBtnActive)}
                      onClick={() => toggleAlly(c.id)}
                    >
                      <span className={s.optName}>{combatantLabel(c, true)}</span>
                    </button>
                  ))}
              </div>
            </>
          )}
          <button
            type="button"
            className="ao-btn ao-btn--sm ao-btn--primary"
            disabled={!teleporterId || !hasCell || busy}
            onClick={doTeleport}
          >
            {t('tactical.forced.teleportGo')}
          </button>
        </div>
      )}
    </div>
  );
}
