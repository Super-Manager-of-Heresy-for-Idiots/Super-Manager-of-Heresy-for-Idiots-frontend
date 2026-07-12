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
 *
 * Shove/Grapple are server-authoritative opposed contests (the standard-actions panel),
 * not a client-side token push.
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
import { mapSessionApi } from '../api';
import { useCreateTokenFromCombatant } from '../hooks';
import { isPointRevealed } from './fogGeometry';
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
import type { FogShapeDto, UUID } from '../types';
import { buildFromCombatantRequest } from './combatantPlacement';
import { MovementOverlay } from './workspace/MovementOverlay';
import { zoneCoversCell } from './workspace/aoeCoverage';
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
  /** Token ids of flying combatants (Phase 2.13) — float animation on the board. */
  flyingTokenIds?: ReadonlySet<string>;
}

export function TacticalMapCenterPanel({
  sessionId,
  battleId,
  battleActive,
  isGm,
  movement,
  flyingTokenIds,
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
  const mapElements = useMapSessionStore((st) => st.mapElements);
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
  const setMovePending = useMapTransientStore((st) => st.setMovePending);
  const clearCombatAction = useMapTransientStore((st) => st.clearCombatAction);

  const tokens = useMemo(() => {
    const list = tokenIds.map((id) => tokensById[id]).filter(Boolean);
    // Players don't see tokens standing in fogged cells (MVP client-side occlusion — the
    // server doesn't yet filter by fog). The GM always sees every token (fog is translucent).
    if (isGm || !fog) return list;
    return list.filter((tk) =>
      isPointRevealed(fog.revealed, tk.gridX + (tk.widthCells ?? 1) / 2, tk.gridY + (tk.heightCells ?? 1) / 2),
    );
  }, [tokenIds, tokensById, isGm, fog]);
  const remoteDragPreviews = useMemo(
    () => Object.values(remoteDragPreviewsByTokenId),
    [remoteDragPreviewsByTokenId],
  );
  // Session-scoped AoE spell zones (Phase 2.3); builder elements are not drawn in the tactical view.
  // The cast panel's aiming preview is appended as a pseudo-zone so the player sees the template live.
  const aoePreview = useMapTransientStore((st) => st.aoePreview);
  const aoeZones = useMemo(() => {
    // Auras (Phase 3.1) follow their attached token: render them at the token's live position.
    const tokenPos = new Map(tokens.map((tk) => [tk.id, { gridX: tk.gridX, gridY: tk.gridY }]));
    const zones = mapElements
      .filter((el) => {
        const p = el.properties as Record<string, unknown>;
        return el.mapSessionId != null && (p?.aoe === true || p?.aura === true);
      })
      .map((el) => {
        const attached = (el.properties as Record<string, unknown>)?.attachedTokenId as string | undefined;
        const at = attached ? tokenPos.get(attached) : undefined;
        return at ? { ...el, gridX: at.gridX, gridY: at.gridY } : el;
      });
    if (!aoePreview) return zones;
    return [
      ...zones,
      {
        id: 'aoe-preview',
        mapId: '',
        mapSessionId: sessionId,
        elementType: aoePreview.shape,
        gridX: aoePreview.originX,
        gridY: aoePreview.originY,
        widthCells: 1,
        heightCells: 1,
        points: null,
        style: {},
        properties: {
          aoe: true,
          preview: true,
          sizeFt: aoePreview.sizeFt,
          rotationDeg: aoePreview.rotationDeg,
          label: aoePreview.label,
        },
        zIndex: 0,
        createdBy: '',
        createdAt: '',
        updatedAt: '',
      } as unknown as (typeof zones)[number],
    ];
  }, [mapElements, aoePreview, sessionId, tokens]);
  const cursors = useMemo(
    () => Object.values(remoteCursorsByUserId).filter((c) => c.userId !== me?.id),
    [remoteCursorsByUserId, me?.id],
  );

  // GM "out of rules" mode: lets the GM drag ANY token during an active battle, sending
  // `force` so the server (which now enforces turn/budget/occupancy) applies the move as a
  // logged GM override instead of rejecting it. No effect for non-GMs or outside battle.
  // Shared via the transient store so the inspector's GM slot tools react to the same toggle.
  const forceMode = useMapTransientStore((st) => st.forceMode);
  const setForceMode = useMapTransientStore((st) => st.setForceMode);

  // GM fog paint tool (Phase 1.6): when 'reveal'/'hide', a grid-cell click paints a 1×1
  // fog cell instead of selecting/moving. 'off' restores normal interaction. GM-only.
  const [fogTool, setFogTool] = useState<'off' | 'reveal' | 'hide'>('off');
  // GM difficult-terrain paint tool (Phase 2.11): a grid-cell click toggles the cell's difficult flag.
  const [difficultTool, setDifficultTool] = useState(false);

  const paintDifficultCell = useCallback(
    (cell: GridCoord) => {
      // Fire-and-forget: the server broadcasts TILE_TERRAIN_UPDATED and the committed store resyncs.
      mapSessionApi.toggleDifficult(sessionId, cell.gridX, cell.gridY).catch(() =>
        toast.error(t('tactical.terrain.error')),
      );
    },
    [sessionId, t],
  );

  // Presence throttle (Phase 2.14): the cursor fires on every mouse move; cap the broadcast to ~12/s
  // so a busy table doesn't flood the WS with presence frames. The last position still lands.
  const lastCursorSentAt = useRef(0);
  const sendCursorThrottled = useCallback(
    (cell: { gridX: number; gridY: number; screenX: number; screenY: number } | null) => {
      if (!cell) return;
      const now = Date.now();
      if (now - lastCursorSentAt.current < 80) return;
      lastCursorSentAt.current = now;
      realtime.sendCursor({
        gridX: cell.gridX,
        gridY: cell.gridY,
        screenX: cell.screenX,
        screenY: cell.screenY,
      });
    },
    [realtime],
  );

  const paintFogCell = useCallback(
    (cell: GridCoord) => {
      const shape: FogShapeDto = {
        type: 'RECT',
        x: cell.gridX,
        y: cell.gridY,
        width: 1,
        height: 1,
        points: null,
      };
      const request = fogTool === 'hide' ? mapSessionApi.hideFog : mapSessionApi.revealFog;
      // Fire-and-forget: the server broadcasts FOG_REVEALED/HIDDEN and the committed store
      // applies it (revision-guarded), so every client — including this one — re-renders.
      request(sessionId, shape).catch(() => toast.error(t('tactical.fog.error')));
    },
    [fogTool, sessionId, t],
  );

  const revealAllFog = useCallback(() => {
    mapSessionApi.revealAllFog(sessionId).catch(() => toast.error(t('tactical.fog.error')));
  }, [sessionId, t]);

  const hideAllFog = useCallback(() => {
    mapSessionApi.hideAllFog(sessionId).catch(() => toast.error(t('tactical.fog.error')));
  }, [sessionId, t]);

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
  // Non-walk modes ignore the low→high ground rule and difficult ground (Phase 2.11).
  const nonWalkMode = moveMode != null && moveMode !== 'WALK';
  const rangeForMode = movement
    ? moveMode === 'FLY'
      ? movement.flyRangeCells
      : moveMode === 'SWIM'
        ? movement.swimRangeCells
        : moveMode === 'CLIMB'
          ? movement.climbRangeCells
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
  // (0 default, 1/2 high ground). This switches the low→high reach rule on in computeReach.
  const elevationByCell = useMemo(() => {
    const m = new Map<string, number>();
    for (const tile of tileStates) m.set(cellKey(tile.gridX, tile.gridY), tile.terrainLevel);
    return m;
  }, [tileStates]);
  const elevationAt = useCallback(
    (gridX: number, gridY: number) => elevationByCell.get(cellKey(gridX, gridY)) ?? 0,
    [elevationByCell],
  );

  // Difficult terrain (Phase 2.11): GM-painted difficult tiles + AoE spell zones that impose it
  // (Web, properties.terrain=DIFFICULT). Doubles the entry cost in the preview to mirror the server.
  const difficultTiles = useMemo(() => {
    const set = new Set<string>();
    for (const tile of tileStates) if (tile.difficult) set.add(cellKey(tile.gridX, tile.gridY));
    return set;
  }, [tileStates]);
  const difficultZones = useMemo(
    () => mapElements.filter((z) => z.properties?.terrain === 'DIFFICULT'),
    [mapElements],
  );
  const difficultAt = useCallback(
    (gridX: number, gridY: number) =>
      difficultTiles.has(cellKey(gridX, gridY)) ||
      difficultZones.some((z) => zoneCoversCell(z, gridX, gridY)),
    [difficultTiles, difficultZones],
  );

  // Doors (Phase 3.3): session DOOR elements — rendered by MapDoorLayer (secret ones GM-only).
  const doors = useMemo(
    () =>
      mapElements.filter(
        (el) => el.mapSessionId != null && (el.properties as Record<string, unknown>)?.door === true,
      ),
    [mapElements],
  );

  // Closed / locked / secret doors (Phase 3.3) block passage: treat their cells as occupied in the
  // reach flood fill (mirrors the map-service MovementValidator's DOOR_CLOSED rejection).
  const closedDoorCells = useMemo(() => {
    const set = new Set<string>();
    for (const el of mapElements) {
      const p = el.properties as Record<string, unknown>;
      if (el.mapSessionId == null || p?.door !== true || p?.state === 'OPEN') continue;
      const w = Math.max(1, Math.round(Number(p?.widthCells ?? 1)));
      const h = Math.max(1, Math.round(Number(p?.heightCells ?? 1)));
      const x0 = Math.round(el.gridX);
      const y0 = Math.round(el.gridY);
      for (let dx = 0; dx < w; dx += 1) for (let dy = 0; dy < h; dy += 1) set.add(cellKey(x0 + dx, y0 + dy));
    }
    return set;
  }, [mapElements]);

  const reach = useMemo(() => {
    if (!movement || !origin || !map || !moveMode) return null;
    const occupied = occupiedCells(tokens, movement.activeTokenId);
    for (const c of closedDoorCells) occupied.add(c);
    return computeReach(
      origin,
      effectiveRange,
      occupied,
      boundsFromGrid(map.gridConfig),
      { elevationAt, ignoreGround: nonWalkMode, difficultAt },
    );
  }, [movement, origin, map, moveMode, nonWalkMode, effectiveRange, tokens, elevationAt, difficultAt, closedDoorCells]);

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

  // Token click: normal selection (focuses the inspector). Shove is now a server contest.
  const handleSelectToken = useCallback(
    (tokenId: UUID | null) => {
      setSelectedToken(tokenId);
    },
    [setSelectedToken],
  );

  // Empty-cell click: place a combatant (placement mode), stage a move destination
  // (MOVE/FLY action), else select the cell for the inspector.
  const onEmptyCellClick = useCallback(
    (cell: GridCoord) => {
      if (isGm && fogTool !== 'off') {
        paintFogCell(cell);
        return;
      }
      if (isGm && difficultTool) {
        paintDifficultCell(cell);
        return;
      }
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
    [isGm, fogTool, paintFogCell, difficultTool, paintDifficultCell, placement, placeToken, battleId, clearPlacement, realtime, moveMode, reach, setMovePending, setSelectedCell],
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
      movementMode: moveMode ?? 'WALK',
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
  }, [movement, reach, origin, pendingCell, currentRevision, me?.id, realtime, setLocalDragPreview, t, clearCombatAction, armMoveWatchdog, isGm, forceMode, moveMode]);

  const cancelAction = useCallback(() => {
    clearCombatAction();
    setLocalDragPreview(null);
  }, [clearCombatAction, setLocalDragPreview]);

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


  return (
    <div className={s.centerWrap}>
      <MapViewport
        imageAssetId={map.imageAssetId}
        grid={map.gridConfig}
        tokens={tokens}
        tiles={tileStates}
        fog={fog}
        aoeZones={aoeZones}
        doors={doors}
        doorViewerIsGm={isGm}
        fogViewerIsGm={isGm}
        selectedTokenId={selectedTokenId}
        flyingTokenIds={flyingTokenIds}
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
        cellToolActive={isGm && (fogTool !== 'off' || difficultTool)}
        onCursorMove={sendCursorThrottled}
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

      {isGm && (
        <div className={cn('ao-panel', s.fogTools)}>
          <span className={cn('ao-overline', s.fogToolsLabel)}>{t('tactical.fog.title')}</span>
          <button
            type="button"
            className={cn('ao-btn ao-btn--sm', fogTool === 'reveal' ? 'ao-btn--primary' : 'ao-btn--ghost')}
            aria-pressed={fogTool === 'reveal'}
            onClick={() => {
              setDifficultTool(false);
              setFogTool((m) => (m === 'reveal' ? 'off' : 'reveal'));
            }}
          >
            {t('tactical.fog.reveal')}
          </button>
          <button
            type="button"
            className={cn('ao-btn ao-btn--sm', fogTool === 'hide' ? 'ao-btn--primary' : 'ao-btn--ghost')}
            aria-pressed={fogTool === 'hide'}
            onClick={() => {
              setDifficultTool(false);
              setFogTool((m) => (m === 'hide' ? 'off' : 'hide'));
            }}
          >
            {t('tactical.fog.hide')}
          </button>
          <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={revealAllFog}>
            {t('tactical.fog.revealAll')}
          </button>
          <button type="button" className="ao-btn ao-btn--sm ao-btn--ghost" onClick={hideAllFog}>
            {t('tactical.fog.hideAll')}
          </button>
          <button
            type="button"
            className={cn('ao-btn ao-btn--sm', difficultTool ? 'ao-btn--primary' : 'ao-btn--ghost')}
            aria-pressed={difficultTool}
            title={t('tactical.terrain.difficultHint')}
            onClick={() => {
              setFogTool('off');
              setDifficultTool((on) => !on);
            }}
          >
            {t('tactical.terrain.difficult')}
          </button>
        </div>
      )}

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
        </div>
      )}
    </div>
  );
}
