/**
 * Owns the realtime lifecycle for ONE map session (per 07_PAGES_AND_HOOKS):
 *
 *  1. load the REST snapshot → seed the committed store;
 *  2. open the WebSocket and subscribe events / presence / user errors;
 *  3. send JOIN with the snapshot's revision.
 *
 * Recovery: a revision gap (or a REVISION_CONFLICT on our own move command) flips
 * `needsResync` in the committed store, which reloads the snapshot and re-JOINs. A
 * socket reconnect also reloads the snapshot (we may have missed events while down).
 * On unmount: LEAVE, disconnect, and clear both stores + connection state.
 *
 * Movement is NEVER optimistically committed here — a token only moves once the
 * authoritative TOKEN_MOVED event arrives through the committed reducer.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { MapApiError, UUID } from '../types';
import { mapApi } from '../api';
import { isRevisionConflict, parseMapApiError } from '../utils';
import { useMapSessionStore, useMapTransientStore } from '../state';
import { MapStompClient } from './mapStompClient';
import { createMapMessageRouter } from './mapWsMessageRouter';
import { useMapConnectionStore, type MapConnectionState } from './mapConnectionStore';
import type {
  CursorPayload,
  DragPreviewPayload,
  MoveTokenPayload,
  PingPayload,
} from './mapWsTypes';

export interface UseMapRealtimeResult {
  connectionState: MapConnectionState;
  /** True while the initial snapshot is loading. */
  isLoading: boolean;
  /** Last surfaced error (snapshot load, or a user-queue command error). */
  error: MapApiError | null;
  sendMoveToken: (payload: MoveTokenPayload) => void;
  sendDragPreview: (payload: DragPreviewPayload) => void;
  sendCursor: (payload: CursorPayload) => void;
  sendPing: (payload: PingPayload) => void;
  /** Force a snapshot reload (e.g. a user-facing "resync" affordance). */
  resync: () => void;
}

function fallbackError(message: string): MapApiError {
  return { code: 'INTERNAL_ERROR', message };
}

export function useMapRealtime(sessionId: UUID | null): UseMapRealtimeResult {
  const connectionState = useMapConnectionStore((s) => s.connectionState);
  const needsResync = useMapSessionStore((s) => s.needsResync);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<MapApiError | null>(null);

  const clientRef = useRef<MapStompClient | null>(null);

  const loadSnapshot = useCallback(async (): Promise<void> => {
    if (!sessionId) return;
    const snapshot = await mapApi.sessions.getSnapshot(sessionId);
    useMapSessionStore.getState().initFromSnapshot(snapshot);
  }, [sessionId]);

  // Main lifecycle — re-runs only when the session id changes.
  useEffect(() => {
    if (!sessionId) return;

    let cancelled = false;
    let firstConnect = true;
    const transient = useMapTransientStore.getState();

    const router = createMapMessageRouter({
      applyCommittedEvent: (event) => useMapSessionStore.getState().applyEvent(event),
      upsertRemoteDragPreview: transient.upsertRemoteDragPreview,
      upsertRemoteCursor: transient.upsertRemoteCursor,
      addPing: transient.addPing,
      onError: (err) => {
        setError(err);
        // A conflict on our own command means our revision is behind → resync.
        if (isRevisionConflict(err)) useMapSessionStore.getState().markNeedsResync();
      },
      onPresenceLeave: (userId) => {
        useMapTransientStore.getState().clearRemoteCursor(userId);
      },
    });

    const client = new MapStompClient({
      sessionId,
      router,
      onConnectionStateChange: useMapConnectionStore.getState().setConnectionState,
      onConnected: () => {
        if (firstConnect) {
          firstConnect = false;
          client.sendJoin({ clientRevision: useMapSessionStore.getState().currentRevision });
        } else {
          // Reconnected: we may have missed events → reload snapshot + re-JOIN.
          useMapSessionStore.getState().markNeedsResync();
        }
      },
    });
    clientRef.current = client;

    setIsLoading(true);
    setError(null);
    void (async () => {
      try {
        await loadSnapshot();
        if (cancelled) return;
        client.activate();
      } catch (err) {
        if (cancelled) return;
        setError(parseMapApiError(err) ?? fallbackError('Failed to load map snapshot'));
        useMapConnectionStore.getState().setConnectionState('offline');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      client.sendLeave(); // no-op when not connected
      client.deactivate();
      clientRef.current = null;
      useMapTransientStore.getState().clearTransient();
      useMapSessionStore.getState().reset();
      useMapConnectionStore.getState().reset();
    };
  }, [sessionId, loadSnapshot]);

  // Resync watcher — a revision gap or conflict reloads the snapshot and re-JOINs.
  useEffect(() => {
    if (!needsResync || !sessionId) return;
    let cancelled = false;
    void (async () => {
      try {
        await loadSnapshot(); // initFromSnapshot clears needsResync
        if (cancelled) return;
        clientRef.current?.sendJoin({
          clientRevision: useMapSessionStore.getState().currentRevision,
        });
      } catch (err) {
        if (cancelled) return;
        setError(parseMapApiError(err) ?? fallbackError('Failed to resync map'));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [needsResync, sessionId, loadSnapshot]);

  const resync = useCallback(() => {
    useMapSessionStore.getState().markNeedsResync();
  }, []);

  const sendMoveToken = useCallback((payload: MoveTokenPayload) => {
    clientRef.current?.sendMoveToken(payload);
  }, []);
  const sendDragPreview = useCallback((payload: DragPreviewPayload) => {
    clientRef.current?.sendDragPreview(payload);
  }, []);
  const sendCursor = useCallback((payload: CursorPayload) => {
    clientRef.current?.sendCursor(payload);
  }, []);
  const sendPing = useCallback((payload: PingPayload) => {
    clientRef.current?.sendPing(payload);
  }, []);

  return {
    connectionState,
    isLoading,
    error,
    sendMoveToken,
    sendDragPreview,
    sendCursor,
    sendPing,
    resync,
  };
}
