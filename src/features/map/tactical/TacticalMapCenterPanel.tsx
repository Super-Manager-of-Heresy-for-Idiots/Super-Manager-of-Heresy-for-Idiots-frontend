/**
 * Center column of the tactical workspace: the live map runtime.
 *
 * This owns the realtime lifecycle for the linked map session (one {@link useMapRealtime}
 * per session) and wires the committed/transient stores into {@link MapViewport} with the
 * same server-authoritative move flow as {@link MapSessionPage} (drag → ghost + presence,
 * drop → MOVE_TOKEN with `expectedRevision`, snap-back on error). The battle overlay
 * (token labels/HP, current-turn ring, attack/AoE previews) is layered on in later prompts;
 * task 01 only composes the runtime so the workspace has a working center.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import toast from 'react-hot-toast';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { ErrorAltar } from '@/components/ordo';
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
import s from './TacticalBattlePage.module.css';

interface TacticalMapCenterPanelProps {
  sessionId: UUID;
  battleId: UUID;
}

export function TacticalMapCenterPanel({ sessionId, battleId }: TacticalMapCenterPanelProps) {
  const t = useT();
  const me = useAuthStore((st) => st.user);
  const realtime = useMapRealtime(sessionId);
  const placeToken = useCreateTokenFromCombatant(sessionId);

  const isLoaded = useMapSessionStore((st) => st.isLoaded);
  const session = useMapSessionStore((st) => st.session);
  const map = useMapSessionStore((st) => st.map);
  const tokensById = useMapSessionStore((st) => st.tokensById);
  const tokenIds = useMapSessionStore((st) => st.tokenIds);
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

  const pendingMove = useRef<{ tokenId: UUID; gridX: number; gridY: number } | null>(null);
  const isConnected = realtime.connectionState === 'connected';
  const sessionClosed = session?.status === 'CLOSED';

  const canDragToken = useCallback(
    (tokenId: UUID) => {
      if (!isConnected || sessionClosed || !permissions) return false;
      return permissions.canMoveAnyToken || permissions.movableTokenIds.includes(tokenId);
    },
    [isConnected, sessionClosed, permissions],
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
      realtime.sendMoveToken({
        tokenId,
        expectedRevision: currentRevision,
        to: { gridX: cell.gridX, gridY: cell.gridY },
      });
    },
    [tokensById, currentRevision, me?.id, realtime, setLocalDragPreview],
  );

  const onTokenDragCancel = useCallback(() => {
    pendingMove.current = null;
    setLocalDragPreview(null);
  }, [setLocalDragPreview]);

  // Placement mode: a click on an empty cell drops a linked token for the chosen
  // combatant via map-service (grid coords only), then exits placement and resyncs
  // so the new token + tokenCombatLink land immediately (without waiting on the event).
  const onEmptyCellClick = useCallback(
    (cell: GridCoord) => {
      // Placement mode → drop a linked token; otherwise select the cell for the inspector.
      if (placement) {
        if (placeToken.isPending) return;
        const request = buildFromCombatantRequest(battleId, placement.combatantId, cell);
        placeToken.mutate(request, {
          onSuccess: () => {
            clearPlacement();
            realtime.resync();
          },
        });
        return;
      }
      setSelectedCell({ gridX: cell.gridX, gridY: cell.gridY });
    },
    [placement, placeToken, battleId, clearPlacement, realtime, setSelectedCell],
  );

  // Resolve a pending move once the committed token reaches the target (TOKEN_MOVED).
  useEffect(() => {
    const pm = pendingMove.current;
    if (!pm) return;
    const tok = tokensById[pm.tokenId];
    if (tok && tok.gridX === pm.gridX && tok.gridY === pm.gridY) {
      pendingMove.current = null;
      setLocalDragPreview(null);
    }
  }, [tokensById, setLocalDragPreview]);

  // Surface command errors once and snap a failed move back to its committed cell.
  const lastToastedError = useRef<unknown>(null);
  useEffect(() => {
    const err = realtime.error;
    if (!err || err === lastToastedError.current) return;
    lastToastedError.current = err;
    if (isLoaded) toast.error(t(mapErrorI18nKey(err)));
    if (pendingMove.current) {
      pendingMove.current = null;
      setLocalDragPreview(null);
    }
  }, [realtime.error, isLoaded, t, setLocalDragPreview]);

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
    <MapViewport
      imageAssetId={map.imageAssetId}
      grid={map.gridConfig}
      tokens={tokens}
      selectedTokenId={selectedTokenId}
      remoteDragPreviews={remoteDragPreviews}
      localDragPreview={localDragPreview}
      cursors={cursors}
      pings={pings}
      onSelectToken={setSelectedToken}
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
    />
  );
}
