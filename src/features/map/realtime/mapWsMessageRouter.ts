/**
 * Pure routing of incoming STOMP messages to store actions. No socket, no React —
 * the {@link MapStompClient} parses raw frames to JSON and hands them here, so the
 * branching (committed vs transient vs error) is unit-testable in isolation.
 *
 *  - events topic   → committed reducer (revision guard runs in the store)
 *  - presence topic → transient overlays (drag previews, cursors, pings)
 *  - user errors    → normalized {@link MapApiError} for the caller to surface
 *
 * Everything is defensive: a malformed committed event is dropped (the next valid
 * event's revision gap will trigger a resync anyway), never thrown.
 */

import type { MapApiError, UUID } from '../types';
import type { MapCommittedEvent, MapPing, RemoteCursor, TokenDragPreview } from '../state';
import { parseMapApiError } from '../utils';

export interface MapMessageRouterDeps {
  /** Dispatch a committed event into the revision-guarded store. */
  applyCommittedEvent: (event: MapCommittedEvent) => void;
  upsertRemoteDragPreview: (preview: TokenDragPreview) => void;
  upsertRemoteCursor: (cursor: RemoteCursor) => void;
  addPing: (ping: MapPing) => void;
  /** A user-queue error (already normalized). */
  onError?: (error: MapApiError) => void;
  onPresenceJoin?: (userId: UUID) => void;
  onPresenceLeave?: (userId: UUID) => void;
  /** Injectable clock/id for deterministic tests. */
  now?: () => number;
  newId?: () => string;
}

export interface MapMessageRouter {
  handleEventsMessage: (raw: unknown) => void;
  handlePresenceMessage: (raw: unknown) => void;
  handleErrorMessage: (raw: unknown) => void;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function str(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function pointFromPayload(payload: Record<string, unknown>): { gridX: number; gridY: number } | null {
  const directX = num(payload.gridX);
  const directY = num(payload.gridY);
  if (directX !== null && directY !== null) return { gridX: directX, gridY: directY };

  const to = isRecord(payload.to) ? payload.to : null;
  if (!to) return null;
  const gridX = num(to.gridX);
  const gridY = num(to.gridY);
  return gridX !== null && gridY !== null ? { gridX, gridY } : null;
}

export function createMapMessageRouter(deps: MapMessageRouterDeps): MapMessageRouter {
  const now = deps.now ?? Date.now;
  const newId = deps.newId ?? (() => crypto.randomUUID());

  return {
    handleEventsMessage(raw) {
      if (!isRecord(raw)) return;
      const type = str(raw.type);
      const revision = num(raw.revision);
      // Committed events MUST have a type and a numeric revision.
      if (!type || revision === null) return;
      deps.applyCommittedEvent({ type: type as MapCommittedEvent['type'], revision, payload: raw.payload });
    },

    handlePresenceMessage(raw) {
      if (!isRecord(raw)) return;
      const type = str(raw.type);
      const actorUserId = str(raw.actorUserId);
      if (!type || !actorUserId) return;
      const payload = isRecord(raw.payload) ? raw.payload : undefined;

      switch (type) {
        case 'TOKEN_DRAG_PREVIEW': {
          if (!payload) return;
          const tokenId = str(payload.tokenId);
          const point = pointFromPayload(payload);
          if (!tokenId || !point) return;
          deps.upsertRemoteDragPreview({ tokenId, ...point, actorUserId, updatedAt: now() });
          return;
        }
        case 'CURSOR_UPDATE': {
          if (!payload) return;
          const gridX = num(payload.gridX);
          const gridY = num(payload.gridY);
          if (gridX === null || gridY === null) return;
          deps.upsertRemoteCursor({ userId: actorUserId, gridX, gridY, updatedAt: now() });
          return;
        }
        case 'PING': {
          if (!payload) return;
          const gridX = num(payload.gridX);
          const gridY = num(payload.gridY);
          if (gridX === null || gridY === null) return;
          deps.addPing({ id: newId(), userId: actorUserId, gridX, gridY, createdAt: now() });
          return;
        }
        case 'JOIN_MAP_SESSION_EVENT':
          deps.onPresenceJoin?.(actorUserId);
          return;
        case 'LEAVE_MAP_SESSION_EVENT':
          deps.onPresenceLeave?.(actorUserId);
          return;
        default:
          return;
      }
    },

    handleErrorMessage(raw) {
      const error = parseMapApiError(raw);
      if (error) deps.onError?.(error);
    },
  };
}
