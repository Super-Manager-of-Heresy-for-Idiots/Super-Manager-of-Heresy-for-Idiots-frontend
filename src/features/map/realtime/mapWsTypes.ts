/**
 * Map-service WebSocket wire types (STOMP message bodies). Mirrors the backend
 * `CommandEnvelope`, `MapEventEnvelope`, presence broadcasts, and `MapErrorMessage`.
 *
 * Note the asymmetry the backend actually uses:
 *  - COMMITTED events ride `/topic/.../events` as a {@link MapEventEnvelope} with a
 *    sequential `revision`.
 *  - TRANSIENT presence rides `/topic/.../presence` as a {@link MapPresenceMessage}
 *    with `actorUserId` and NO revision.
 *  - The command `type` string is informational only — the backend routes by
 *    destination, not by `type`.
 */

import type { MapEventType, UUID } from '../types';

export interface MapGridPosition {
  gridX: number;
  gridY: number;
}

/* ── Commands (client → server) ─────────────────────────────── */

export interface MapCommandEnvelope<TPayload = Record<string, unknown>> {
  type: string;
  requestId: UUID;
  sentAt: string;
  payload: TPayload;
}

/** Informational command discriminators (backend routes by destination, not these). */
export const MapCommandType = {
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  MOVE_TOKEN: 'MOVE_TOKEN',
  DRAG_PREVIEW: 'TOKEN_DRAG_PREVIEW',
  CURSOR: 'CURSOR_UPDATE',
  PING: 'PING',
} as const;

export interface JoinSessionPayload {
  clientRevision: number;
}

/** Backend `MoveTokenCommand` — `expectedRevision` is required for the revision guard. */
export interface MoveTokenPayload {
  tokenId: UUID;
  expectedRevision: number;
  to: MapGridPosition;
  path?: MapGridPosition[];
}

export interface DragPreviewPayload {
  tokenId: UUID;
  to: MapGridPosition;
}

export interface CursorPayload {
  gridX: number;
  gridY: number;
  screenX: number;
  screenY: number;
}

export interface PingPayload {
  clientTime: string;
}

/* ── Events (server → client) ───────────────────────────────── */

/** Committed event on `/topic/.../events` (backend `MapEventEnvelope`). */
export interface MapEventEnvelope<TPayload = Record<string, unknown>> {
  type: MapEventType;
  eventId: UUID;
  sessionId: UUID;
  revision: number;
  actorUserId: UUID;
  createdAt: string;
  payload: TPayload;
}

export type MapPresenceType =
  | 'JOIN_MAP_SESSION_EVENT'
  | 'LEAVE_MAP_SESSION_EVENT'
  | 'TOKEN_DRAG_PREVIEW'
  | 'CURSOR_UPDATE'
  | 'PING';

/**
 * Transient presence broadcast on `/topic/.../presence`. JOIN/LEAVE carry no
 * `payload`; drag/cursor/ping carry one. `actorUserId` is the originating user.
 */
export interface MapPresenceMessage<TPayload = Record<string, unknown>> {
  type: MapPresenceType | string;
  sessionId: UUID;
  actorUserId: UUID;
  payload?: TPayload;
}
