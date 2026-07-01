/**
 * Single source of truth for map-service STOMP destinations. These mirror the
 * backend `MapSessionWebSocketController` (`@MessageMapping("/map-sessions/...")`
 * under the `/app` application prefix) and `TransactionalMapEventBroadcaster`.
 * If the backend paths ever move, this is the ONLY file to change.
 */

import type { UUID } from '../types';

export const mapWsDestinations = {
  /* Client → server (SEND to `/app/...`). */
  appJoin: (sessionId: UUID) => `/app/map-sessions/${sessionId}/join`,
  appLeave: (sessionId: UUID) => `/app/map-sessions/${sessionId}/leave`,
  appMoveToken: (sessionId: UUID) => `/app/map-sessions/${sessionId}/move-token`,
  appDragPreview: (sessionId: UUID) => `/app/map-sessions/${sessionId}/drag-preview`,
  appCursor: (sessionId: UUID) => `/app/map-sessions/${sessionId}/cursor`,
  appPing: (sessionId: UUID) => `/app/map-sessions/${sessionId}/ping`,

  /* Server → client (SUBSCRIBE). */
  /** Committed, revision-bearing events (token moves, deletes, session lifecycle). */
  topicEvents: (sessionId: UUID) => `/topic/map-sessions/${sessionId}/events`,
  /** Transient presence (drag previews, cursors, pings, join/leave). */
  topicPresence: (sessionId: UUID) => `/topic/map-sessions/${sessionId}/presence`,
  /** Per-user command errors (`MapErrorMessage`). */
  userErrors: '/user/queue/map-errors',
} as const;
