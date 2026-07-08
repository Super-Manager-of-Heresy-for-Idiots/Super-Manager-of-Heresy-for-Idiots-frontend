/**
 * Live map session. {@link useMapRealtime} loads the snapshot into the committed
 * store and owns the socket; this page wires that committed/transient state into the
 * renderer and implements the server-authoritative move flow (06_WEBSOCKET_FLOW /
 * Prompt 8):
 *
 *   drag      → local ghost + TOKEN_DRAG_PREVIEW presence (no commit)
 *   drop      → MOVE_TOKEN with `expectedRevision`; the ghost is KEPT until the
 *               authoritative TOKEN_MOVED lands (committed reaches the target) …
 *   on error  → … or until the command fails (REVISION_CONFLICT triggers a resync in
 *               the hook); either way the ghost is dropped and the token snaps back to
 *               its committed cell. Movement is NEVER written through REST.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ErrorAltar } from '@/components/ordo';
import { useT } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { MapViewport, type MapToolbarLabels } from '../components';
import { useMapRealtime, type MapConnectionState } from '../realtime';
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
import s from './MapSessionPage.module.css';

export default function MapSessionPage() {
  const t = useT();
  const { sessionId } = useParams<{ campaignId: string; sessionId: string }>();
  const me = useAuthStore((st) => st.user);
  const realtime = useMapRealtime(sessionId ?? null);

  // Committed (server-authoritative) state.
  const isLoaded = useMapSessionStore((st) => st.isLoaded);
  const session = useMapSessionStore((st) => st.session);
  const map = useMapSessionStore((st) => st.map);
  const tokensById = useMapSessionStore((st) => st.tokensById);
  const tokenIds = useMapSessionStore((st) => st.tokenIds);
  const permissions = useMapSessionStore((st) => st.permissions);
  const fog = useMapSessionStore((st) => st.fog);
  const currentRevision = useMapSessionStore((st) => st.currentRevision);

  // Transient (local + presence) state.
  const selectedTokenId = useMapTransientStore((st) => st.selectedTokenId);
  const setSelectedToken = useMapTransientStore((st) => st.setSelectedToken);
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

  // The move we're waiting on the server to confirm; the local ghost mirrors it.
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
      const token = tokensById[tokenId];
      // Dropped on the same committed cell → no move; just drop the ghost.
      if (token && token.gridX === cell.gridX && token.gridY === cell.gridY) {
        pendingMove.current = null;
        setLocalDragPreview(null);
        return;
      }
      pendingMove.current = { tokenId, gridX: cell.gridX, gridY: cell.gridY };
      // Keep the ghost at the dropped cell until TOKEN_MOVED (or an error) resolves it.
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
      });
      if (!sent) {
        pendingMove.current = null;
        setLocalDragPreview(null);
        toast.error(t('map.conn.offline'));
        realtime.resync();
      }
    },
    [tokensById, currentRevision, me?.id, realtime, setLocalDragPreview, t],
  );

  const onTokenDragCancel = useCallback(() => {
    pendingMove.current = null;
    setLocalDragPreview(null);
  }, [setLocalDragPreview]);

  // Resolve a pending move once the committed token reaches the target (TOKEN_MOVED).
  useEffect(() => {
    const pm = pendingMove.current;
    if (!pm) return;
    const token = tokensById[pm.tokenId];
    if (token && token.gridX === pm.gridX && token.gridY === pm.gridY) {
      pendingMove.current = null;
      setLocalDragPreview(null);
    }
  }, [tokensById, setLocalDragPreview]);

  // Surface command errors once, and snap a failed move back to its committed cell.
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

  /* ── snapshot still loading ──────────────────────────────────── */
  if (!isLoaded && realtime.isLoading) {
    return (
      <div className={cn('ao-panel ao-breathe', s.loading)}>
        <span className={s.loadingText}>{t('map.session.loading')}</span>
      </div>
    );
  }

  /* ── snapshot failed (never loaded) ──────────────────────────── */
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
    <div className={s.page}>
      <header className={s.bar}>
        <div className={s.barLeft}>
          <p className={cn('ao-overline', s.overline)}>{t('map.session.overline')}</p>
          <h3 className="ao-h3">{map.name}</h3>
        </div>
        <div className={s.barRight}>
          <ConnChip state={realtime.connectionState} t={t} />
          <span className={s.rev}>{t('map.session.revision')} {currentRevision}</span>
          {sessionClosed && <span className={s.closed}>{t('map.session.closed')}</span>}
          <button
            className="ao-btn ao-btn--ghost ao-btn--sm"
            onClick={() => realtime.resync()}
          >
            {t('map.session.resync')}
          </button>
        </div>
      </header>

      <div className={s.canvas}>
        <MapViewport
          imageAssetId={map.imageAssetId}
          grid={map.gridConfig}
          tokens={tokens}
          fog={fog}
          fogViewerIsGm={permissions?.canManageMap ?? false}
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
      </div>
    </div>
  );
}

const CONN_CLASS: Record<MapConnectionState, string> = {
  idle: s.connIdle,
  connecting: s.connBusy,
  connected: s.connOk,
  reconnecting: s.connBusy,
  offline: s.connBad,
};

function ConnChip({ state, t }: { state: MapConnectionState; t: (k: string) => string }) {
  return (
    <span className={cn(s.conn, CONN_CLASS[state])}>
      <span className={s.connDot} aria-hidden="true" />
      {t(`map.conn.${state}`)}
    </span>
  );
}
