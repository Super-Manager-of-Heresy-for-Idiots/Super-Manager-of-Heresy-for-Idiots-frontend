/**
 * Center column of the tactical workspace: the live map runtime.
 *
 * Owns the realtime lifecycle for the linked map session and wires the
 * committed/transient stores into {@link MapViewport}. Outside a battle, tokens drag
 * freely per permissions (server-authoritative move, revision-checked).
 *
 * During an ACTIVE battle, movement is ACTION-DRIVEN (no free drag): the action panel
 * arms a default action in the transient store —
 *  - MOVE/FLY → reachable cells are highlighted; the user clicks a cell, a route +
 *    final-position preview is drawn, and nothing commits until they confirm (or they
 *    cancel and the creature stays put). Walk obeys the low→high ground rule (pluggable
 *    terrain hook); fly uses the fly range and ignores ground.
 *  - PUSH → the user clicks an adjacent enemy token; confirm shoves it one cell away
 *    (manual shove for whoever may move the target; full contested resolution is a
 *    backend task — see BACKEND_REQUIREMENTS.md).
 *
 * The map-service enforces turn/budget/occupancy during an active battle (server is
 * the authority and rejects illegal moves with MOVE_REJECTED); these client rules
 * stay as preview + guards so the UI discourages illegal moves before sending them.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ErrorAltar, Rune } from '@/components/ordo';
import { MapViewport, type MapToolbarLabels } from '../components';
import { useCreateTokenFromCombatant } from '../hooks';
import { useMapRealtime } from '../realtime';
import { useMapSessionStore, useMapTransientStore } from '../state';
import {
  isForbidden,
  isMapSessionClosed,
  isNotFound,
  isUnauthorized,
  mapErrorI18nKey,
} from '../utils';
import type { GridCoord } from '../engine';
import type { UUID } from '../types';
import { buildFromCombatantRequest } from './combatantPlacement';
import { MovementOverlay } from './workspace/MovementOverlay';
import {
  boundsFromGrid,
  cellKey,
  computeReach,
  isReachable,
  occupiedCells,
  reconstructPath,
  stepDistance,
  type Cell,
  type MovementConfig,
} from './workspace/movement';
import s from './TacticalBattlePage.module.css';

/**
 * Grace window after sending a MOVE_TOKEN before we stop trusting the optimistic ghost
 * and resync the snapshot. The authoritative TOKEN_MOVED normally lands in well under a
 * second; this only fires when that echo never resolves the move.
 */
const MOVE_CONFIRM_TIMEOUT_MS = 2000;

interface TacticalMapCenterPanelProps {
  sessionId: UUID;
  battleId: UUID;
  /**
   * While true (battle ACTIVE), movement is turn-based and action-driven; free token
   * dragging is disabled. When false (assembling / no battle) tokens drag freely.
   */
  battleActive?: boolean;
  /**
   * Whether the current user is the GM. During preparation the GM may freely drag any
   * placed token to reposition it, regardless of the map-session move grants.
   */
  isGm?: boolean;
  /** Movement gating + preview for the acting combatant; omit to allow free moves. */
  movement?: MovementConfig | null;
}

export function TacticalMapCenterPanel({
  sessionId,
  battleId,
  battleActive,
  isGm,
  movement,
}: TacticalMapCenterPanelProps) {
  const t = useT();
  const me = useAuthStore((st) => st.user);
  const realtime = useMapRealtime(sessionId);
  const placeToken = useCreateTokenFromCombatant(sessionId);

  const isLoaded = useMapSessionStore((st) => st.isLoaded);
  const session = useMapSessionStore((st) => st.session);
  const map = useMapSessionStore((st) => st.map);
  const tokensById = useMapSessionStore((st) => st.tokensById);
  const tokenIds = useMapSessionStore((st) => st.tokenIds);
  const tileStates = useMapSessionStore((st) => st.tileStates);
  const fog = useMapSessionStore((st) => st.fog);
  const permissions = useMapSessionStore((st) => st.permissions);
  const currentRevision = useMapSessionStore((st) => st.currentRevision);

  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const setSelectedToken = useMapTransientStore((st) => st.setSelectedToken);
  const placement = useMapTransientStore((st) => st.placement);
  const clearPlacement = useMapTransientStore((st) => st.clearPlacement);
  const setSelectedCell = useMapTransientStore((st) => st.setSelectedCell);
  const localDragPreview = useMapTransientStore((st) => st.localDragPreview);
  const setLocalDragPreview = useMapTransientStore((st) => st.setLocalDragPreview);
  const remoteDragPreviewsByTokenId = useMapTransientStore((st) => st.remoteDragPreviewsByTokenId);
  const remoteCursorsByUserId = useMapTransientStore((st) => st.remoteCursorsByUserId);
  const pings = useMapTransientStore((st) => st.pings);

  const combatAction = useMapTransientStore((st) => st.combatAction);
  const movePending = useMapTransientStore((st) => st.movePending);
  const pushTargetTokenId = useMapTransientStore((st) => st.pushTargetTokenId);
  const setMovePending = useMapTransientStore((st) => st.setMovePending);
  const setPushTarget = useMapTransientStore((st) => st.setPushTarget);
  const clearCombatAction = useMapTransientStore((st) => st.clearCombatAction);

  const tokens = useMemo(
    () => tokenIds.map((id) => tokensById[id]).filter(Boolean),
    [tokenIds, tokensById],
  );
  const remoteDragPreviews = useMemo(
    () => Object.values(remoteDragPreviewsByTokenId),
    [remoteDragPreviewsByTokenId],
  );
  const cursors = useMemo(
    () => Object.values(remoteCursorsByUserId).filter((c) => c.userId !== me?.id),
    [remoteCursorsByUserId, me?.id],
  );

  // GM "out of rules" mode: lets the GM drag ANY token during an active battle, sending
  // `force` so the server (which now enforces turn/budget/occupancy) applies the move as a
  // logged GM override instead of rejecting it. No effect for non-GMs or outside battle.
  const [forceMode, setForceMode] = useState(false);

  const toolbarLabels = useMemo<MapToolbarLabels>(
    () => ({
      zoomIn: t('map.toolbar.zoomIn'),
      zoomOut: t('map.toolbar.zoomOut'),
      fit: t('map.toolbar.fit'),
      reset: t('map.toolbar.reset'),
      toggleGrid: t('map.toolbar.toggleGrid'),
    }),
    [t],
  );

  // A move we've sent and are waiting for the authoritative TOKEN_MOVED to confirm.
  // Until then the local ghost (dashed) holds the destination; on confirmation the
  // committed token reaches it and we drop the ghost (see the resolver effect below).
  const pendingMove = useRef<{ tokenId: UUID; gridX: number; gridY: number } | null>(null);

  // Watchdog for that confirmation. If the authoritative event never resolves the
  // pending move — a dropped/missed event, or the client's revision having drifted so
  // the command no-ops against the server — the ghost would otherwise mask an un-moved
  // token indefinitely, surfacing only as a confusing snap-back when the turn ends.
  // After a short grace window we drop the ghost and resync, so the committed position
  // AND our revision become authoritative again (also unsticking a stale-revision
  // deadlock for subsequent moves). When events flow normally this never fires.
  const moveWatchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clearMoveWatchdog = useCallback(() => {
    if (moveWatchdogRef.current) {
      clearTimeout(moveWatchdogRef.current);
      moveWatchdogRef.current = null;
    }
  }, []);
  const armMoveWatchdog = useCallback(() => {
    clearMoveWatchdog();
    moveWatchdogRef.current = setTimeout(() => {
      moveWatchdogRef.current = null;
      if (!pendingMove.current) return;
      pendingMove.current = null;
      setLocalDragPreview(null);
      realtime.resync();
    }, MOVE_CONFIRM_TIMEOUT_MS);
  }, [clearMoveWatchdog, realtime, setLocalDragPreview]);

  // Cancel any in-flight watchdog when the panel unmounts.
  useEffect(() => clearMoveWatchdog, [clearMoveWatchdog]);

  /* ── Movement (active combatant, action-driven) ──────────────── */

  // Per-turn movement budget; reset (and any staged action disarmed) whenever the
  // acting combatant / round changes.
  const [moveUsed, setMoveUsed] = useState(0);
  const turnKeyRef = useRef<string | null>(null);
  useEffect(() => {
    const key = movement?.turnKey ?? null;
    if (turnKeyRef.current !== key) {
      turnKeyRef.current = key;
      setMoveUsed(0);
      pendingMove.current = null;
      clearMoveWatchdog();
      clearCombatAction();
      setLocalDragPreview(null);
    }
  }, [movement?.turnKey, clearCombatAction, setLocalDragPreview, clearMoveWatchdog]);

  const moveMode = combatAction?.type === 'MOVE' ? combatAction.mode : null;
  const rangeForMode = movement
    ? moveMode === 'FLY'
      ? movement.flyRangeCells
      : movement.walkRangeCells
    : 0;
  const effectiveRange = Math.max(0, rangeForMode - moveUsed);
  // Server-authoritative budget is spent per 0.1; here we mirror it in feet for the HUD
  // (moveUsed/range are in cells — convert with the grid's ft-per-cell).
  const cellWorldSizeFt = Number(map?.gridConfig?.cellWorldSize) || 5;
  const spentFt = Math.round(moveUsed * cellWorldSizeFt);
  const budgetFt = Math.round(rangeForMode * cellWorldSizeFt);

  const activeToken = movement ? tokensById[movement.activeTokenId] : undefined;
  const origin = useMemo<Cell | null>(
    () =>
      activeToken
        ? { gridX: Math.round(activeToken.gridX), gridY: Math.round(activeToken.gridY) }
        : null,
    [activeToken],
  );

  // Terrain hook (Phase 1.9): the snapshot's tileStates give each cell its ground level
  // (0 default, 1/2 high ground). This switches the low→high reach rule on in computeReach;
  // difficult-terrain movement COST stays out of scope (Phase 2.11).
  const elevationByCell = useMemo(() => {
    const m = new Map<string, number>();
    for (const tile of tileStates) m.set(cellKey(tile.gridX, tile.gridY), tile.terrainLevel);
    return m;
  }, [tileStates]);
  const elevationAt = useCallback(
    (gridX: number, gridY: number) => elevationByCell.get(cellKey(gridX, gridY)) ?? 0,
    [elevationByCell],
  );

  const reach = useMemo(() => {
    if (!movement || !origin || !map || !moveMode) return null;
    return computeReach(
      origin,
      effectiveRange,
      occupiedCells(tokens, movement.activeTokenId),
      boundsFromGrid(map.gridConfig),
      { elevationAt, ignoreGround: moveMode === 'FLY' },
    );
  }, [movement, origin, map, moveMode, effectiveRange, tokens, elevationAt]);

  const reachableCells = useMemo<Cell[]>(() => {
    if (!reach || !origin) return [];
    const originKey = cellKey(origin.gridX, origin.gridY);
    const cells: Cell[] = [];
    for (const key of reach.distance.keys()) {
      if (key === originKey) continue;
      const [x, y] = key.split(',').map(Number);
      cells.push({ gridX: x, gridY: y });
    }
    return cells;
  }, [reach, origin]);

  const pendingCell = useMemo<Cell | null>(
    () => (moveMode && movePending ? { gridX: movePending.gridX, gridY: movePending.gridY } : null),
    [moveMode, movePending],
  );

  const previewPath = useMemo<Cell[]>(() => {
    if (!reach || !pendingCell) return [];
    return isReachable(reach, pendingCell) ? reconstructPath(reach, pendingCell) : [];
  }, [reach, pendingCell]);

  const isConnected = realtime.connectionState === 'connected';
  const sessionClosed = session?.status === 'CLOSED';

  // During an active battle there is no free dragging — movement goes through the
  // action flow. Outside battle (preparation / no battle), tokens drag freely: the GM
  // may reposition ANY placed token, everyone else only what the map grants them.
  const canDragToken = useCallback(
    (tokenId: UUID) => {
      if (!isConnected || sessionClosed) return false;
      // In an active battle movement is turn-based; only a GM in explicit "out of rules"
      // mode may free-drag (the move is sent as a logged override).
      if (battleActive) return Boolean(isGm && forceMode);
      if (isGm) return true;
      if (!permissions) return false;
      return permissions.canMoveAnyToken || permissions.movableTokenIds.includes(tokenId);
    },
    [isConnected, sessionClosed, permissions, battleActive, isGm, forceMode],
  );

  const onTokenDragMove = useCallback(
    (tokenId: UUID, cell: GridCoord) => {
      setLocalDragPreview({
        tokenId,
        gridX: cell.gridX,
        gridY: cell.gridY,
        actorUserId: me?.id ?? '',
        updatedAt: Date.now(),
      });
      realtime.sendDragPreview({ tokenId, to: { gridX: cell.gridX, gridY: cell.gridY } });
    },
    [me?.id, realtime, setLocalDragPreview],
  );

  const onTokenDragEnd = useCallback(
    (tokenId: UUID, cell: GridCoord) => {
      const tok = tokensById[tokenId];
      if (tok && tok.gridX === cell.gridX && tok.gridY === cell.gridY) {
        pendingMove.current = null;
        setLocalDragPreview(null);
        return;
      }
      pendingMove.current = { tokenId, gridX: cell.gridX, gridY: cell.gridY };
      setLocalDragPreview({
        tokenId,
        gridX: cell.gridX,
        gridY: cell.gridY,
        actorUserId: me?.id ?? '',
        updatedAt: Date.now(),
      });
      const sent = realtime.sendMoveToken({
        tokenId,
        expectedRevision: currentRevision,
        to: { gridX: cell.gridX, gridY: cell.gridY },
        force: Boolean(isGm && forceMode),
        clientCommandId: crypto.randomUUID(),
      });
      if (!sent) {
        pendingMove.current = null;
        setLocalDragPreview(null);
        toast.error(t('map.conn.offline'));
        realtime.resync();
        return;
      }
      armMoveWatchdog();
    },
    [tokensById, currentRevision, me?.id, realtime, setLocalDragPreview, t, armMoveWatchdog, isGm, forceMode],
  );

  const onTokenDragCancel = useCallback(() => {
    pendingMove.current = null;
    setLocalDragPreview(null);
  }, [setLocalDragPreview]);

  // Token click: in PUSH mode, an adjacent enemy becomes the shove target; otherwise
  // normal selection (focuses the inspector).
  const handleSelectToken = useCallback(
    (tokenId: UUID | null) => {
      if (tokenId && combatAction?.type === 'PUSH' && movement && tokenId !== movement.activeTokenId) {
        const target = tokensById[tokenId];
        const active = tokensById[movement.activeTokenId];
        if (
          target &&
          active &&
          stepDistance(
            { gridX: active.gridX, gridY: active.gridY },
            { gridX: target.gridX, gridY: target.gridY },
          ) === 1
        ) {
          setPushTarget(tokenId);
          return;
        }
        return; // ignore non-adjacent clicks while shoving
      }
      setSelectedToken(tokenId);
    },
    [combatAction, movement, tokensById, setPushTarget, setSelectedToken],
  );

  // Empty-cell click: place a combatant (placement mode), stage a move destination
  // (MOVE/FLY action), else select the cell for the inspector.
  const onEmptyCellClick = useCallback(
    (cell: GridCoord) => {
      if (placement) {
        if (placeToken.isPending) return;
        const request = buildFromCombatantRequest(battleId, placement.combatantId, cell, {
          widthCells: placement.widthCells,
          heightCells: placement.heightCells,
        });
        placeToken.mutate(request, {
          onSuccess: () => {
            clearPlacement();
            realtime.resync();
          },
        });
        return;
      }
      if (moveMode && reach && isReachable(reach, cell)) {
        setMovePending({ gridX: cell.gridX, gridY: cell.gridY });
        return;
      }
      setSelectedCell({ gridX: cell.gridX, gridY: cell.gridY });
    },
    [placement, placeToken, battleId, clearPlacement, realtime, moveMode, reach, setMovePending, setSelectedCell],
  );

  // Commit the staged move on confirm: send MOVE_TOKEN (with path), charge the budget,
  // and disarm. The ghost holds the destination until TOKEN_MOVED resolves it.
  const confirmMove = useCallback(() => {
    if (!movement || !reach || !origin || !pendingCell) return;
    if (!isReachable(reach, pendingCell)) return;
    pendingMove.current = {
      tokenId: movement.activeTokenId,
      gridX: pendingCell.gridX,
      gridY: pendingCell.gridY,
    };
    setLocalDragPreview({
      tokenId: movement.activeTokenId,
      gridX: pendingCell.gridX,
      gridY: pendingCell.gridY,
      actorUserId: me?.id ?? '',
      updatedAt: Date.now(),
    });
    const sent = realtime.sendMoveToken({
      tokenId: movement.activeTokenId,
      expectedRevision: currentRevision,
      to: { gridX: pendingCell.gridX, gridY: pendingCell.gridY },
      path: reconstructPath(reach, pendingCell).map((c) => ({ gridX: c.gridX, gridY: c.gridY })),
      force: Boolean(isGm && forceMode),
      clientCommandId: crypto.randomUUID(),
    });
    if (!sent) {
      pendingMove.current = null;
      setLocalDragPreview(null);
      toast.error(t('map.conn.offline'));
      realtime.resync();
      return;
    }
    armMoveWatchdog();
    setMoveUsed((used) => used + stepDistance(origin, pendingCell));
    clearCombatAction();
  }, [movement, reach, origin, pendingCell, currentRevision, me?.id, realtime, setLocalDragPreview, t, clearCombatAction, armMoveWatchdog, isGm, forceMode]);

  const cancelAction = useCallback(() => {
    clearCombatAction();
    setLocalDragPreview(null);
  }, [clearCombatAction, setLocalDragPreview]);

  // Manual shove: move the target one cell directly away from the actor (whoever may
  // move the target token). Full contested resolution + player support is backend work.
  const confirmPush = useCallback(() => {
    if (!movement || !pushTargetTokenId || !map) return;
    const target = tokensById[pushTargetTokenId];
    const active = tokensById[movement.activeTokenId];
    if (!target || !active) return;
    const dx = Math.sign(Math.round(target.gridX) - Math.round(active.gridX));
    const dy = Math.sign(Math.round(target.gridY) - Math.round(active.gridY));
    if (dx === 0 && dy === 0) return;
    const away = { gridX: Math.round(target.gridX) + dx, gridY: Math.round(target.gridY) + dy };
    const bounds = boundsFromGrid(map.gridConfig);
    const offMap =
      bounds &&
      (away.gridX < bounds.minX || away.gridX > bounds.maxX || away.gridY < bounds.minY || away.gridY > bounds.maxY);
    if (offMap || occupiedCells(tokens, pushTargetTokenId).has(cellKey(away.gridX, away.gridY))) {
      toast.error(t('tactical.push.blocked'));
      return;
    }
    const canMoveTarget =
      permissions?.canMoveAnyToken || permissions?.movableTokenIds.includes(pushTargetTokenId);
    if (!canMoveTarget) {
      toast(t('tactical.push.needsServer'));
      return;
    }
    pendingMove.current = { tokenId: pushTargetTokenId, gridX: away.gridX, gridY: away.gridY };
    setLocalDragPreview({
      tokenId: pushTargetTokenId,
      gridX: away.gridX,
      gridY: away.gridY,
      actorUserId: me?.id ?? '',
      updatedAt: Date.now(),
    });
    const sent = realtime.sendMoveToken({
      tokenId: pushTargetTokenId,
      expectedRevision: currentRevision,
      to: away,
      force: Boolean(isGm && forceMode),
      clientCommandId: crypto.randomUUID(),
    });
    if (!sent) {
      pendingMove.current = null;
      setLocalDragPreview(null);
      toast.error(t('map.conn.offline'));
      realtime.resync();
      return;
    }
    armMoveWatchdog();
    clearCombatAction();
  }, [movement, pushTargetTokenId, map, tokensById, tokens, permissions, currentRevision, me?.id, realtime, setLocalDragPreview, clearCombatAction, t, armMoveWatchdog, isGm, forceMode]);

  // Resolve a pending move once the committed token reaches the target (TOKEN_MOVED).
  useEffect(() => {
    const pm = pendingMove.current;
    if (!pm) return;
    const tok = tokensById[pm.tokenId];
    if (tok && tok.gridX === pm.gridX && tok.gridY === pm.gridY) {
      pendingMove.current = null;
      clearMoveWatchdog();
      setLocalDragPreview(null);
    }
  }, [tokensById, setLocalDragPreview, clearMoveWatchdog]);

  // Surface command errors once and snap a failed move back to its committed cell.
  const lastToastedError = useRef<unknown>(null);
  useEffect(() => {
    const err = realtime.error;
    if (!err || err === lastToastedError.current) return;
    lastToastedError.current = err;
    if (isLoaded) toast.error(t(mapErrorI18nKey(err)));
    if (pendingMove.current) {
      pendingMove.current = null;
      clearMoveWatchdog();
      setLocalDragPreview(null);
    }
  }, [realtime.error, isLoaded, t, setLocalDragPreview, clearMoveWatchdog]);

  if (!isLoaded && realtime.isLoading) {
    return (
      <div className={cn('ao-panel ao-breathe', s.centerStatus)}>
        <span className={s.statusText}>{t('map.session.loading')}</span>
      </div>
    );
  }

  if (!isLoaded || !map) {
    const err = realtime.error;
    const canRetry =
      !err || (!isForbidden(err) && !isNotFound(err) && !isUnauthorized(err) && !isMapSessionClosed(err));
    return (
      <ErrorAltar
        title={t('map.session.loadError')}
        error={err}
        onRetry={canRetry ? () => realtime.resync() : undefined}
        retryLabel={t('common.retry')}
      />
    );
  }

  const pushTargetName = pushTargetTokenId ? tokensById[pushTargetTokenId]?.name : undefined;

  return (
    <div className={s.centerWrap}>
      <MapViewport
        imageAssetId={map.imageAssetId}
        grid={map.gridConfig}
        tokens={tokens}
        tiles={tileStates}
        fog={fog}
        fogViewerIsGm={isGm}
        selectedTokenId={selectedTokenId}
        remoteDragPreviews={remoteDragPreviews}
        localDragPreview={localDragPreview}
        cursors={cursors}
        pings={pings}
        onSelectToken={handleSelectToken}
        canDragToken={canDragToken}
        onTokenDragMove={onTokenDragMove}
        onTokenDragEnd={onTokenDragEnd}
        onTokenDragCancel={onTokenDragCancel}
        onEmptyCellClick={onEmptyCellClick}
        onCursorMove={(cell) => {
          if (cell) {
            realtime.sendCursor({
              gridX: cell.gridX,
              gridY: cell.gridY,
              screenX: cell.screenX,
              screenY: cell.screenY,
            });
          }
        }}
        toolbarLabels={toolbarLabels}
        emptyLabel={t('map.session.noImage')}
        underlay={
          movement && origin && reach ? (
            <MovementOverlay
              grid={map.gridConfig}
              origin={origin}
              reachable={reachableCells}
              target={pendingCell}
              path={previewPath}
              kind={movement.kind}
            />
          ) : null
        }
      />

      {isGm && battleActive && (
        <label className={cn('ao-panel', s.gmForceToggle)} title={t('tactical.gmForce.hint')}>
          <input
            type="checkbox"
            checked={forceMode}
            onChange={(e) => setForceMode(e.target.checked)}
          />
          <span>{t('tactical.gmForce.label')}</span>
        </label>
      )}

      {combatAction && (
        <div className={cn('ao-panel', s.actionBar)} role="status">
          {combatAction.type === 'PUSH' ? (
            <>
              <span className={s.actionBarInfo}>
                {pushTargetName ? t('tactical.push.target', { name: pushTargetName }) : t('tactical.push.pickTarget')}
              </span>
              <div className="ao-row ao-gap-8">
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--danger"
                  disabled={!pushTargetTokenId}
                  onClick={confirmPush}
                >
                  <Rune kind="arrow-r" size={12} color="currentColor" />
                  <span className={s.ml6}>{t('tactical.push.confirm')}</span>
                </button>
                <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={cancelAction}>
                  {t('tactical.move.cancel')}
                </button>
              </div>
            </>
          ) : (
            <>
              <span className={s.actionBarInfo}>
                {pendingCell && origin
                  ? t('tactical.move.distance', { n: stepDistance(origin, pendingCell) })
                  : t('tactical.move.pickCell')}
                {budgetFt > 0 && (
                  <span className={s.moveBudget}>
                    {t('tactical.move.budget', { spent: spentFt, total: budgetFt })}
                  </span>
                )}
              </span>
              <div className="ao-row ao-gap-8">
                <button
                  type="button"
                  className="ao-btn ao-btn--sm ao-btn--primary"
                  disabled={!pendingCell}
                  onClick={confirmMove}
                >
                  <Rune kind="check" size={12} color="currentColor" />
                  <span className={s.ml6}>{t('tactical.move.confirm')}</span>
                </button>
                <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={cancelAction}>
                  {t('tactical.move.cancel')}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
