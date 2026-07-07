/**
 * Map-service error contracts.
 *
 * REST errors and WebSocket command errors share the same `{ code, message,
 * details }` body (backend `ApiErrorResponse` / `MapErrorMessage`). The HTTP
 * status code is carried on the REST response status line, not in the body.
 */

export type MapErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'ASSET_TOO_LARGE'
  | 'UNSUPPORTED_CONTENT_TYPE'
  | 'INVALID_IMAGE'
  | 'GRID_CONFIG_INVALID'
  | 'REVISION_CONFLICT'
  | 'CONFLICT'
  | 'TOKEN_LOCKED'
  | 'MOVE_REJECTED'
  | 'SESSION_CLOSED'
  | 'UPSTREAM_UNAVAILABLE'
  | 'UPSTREAM_PROTOCOL_ERROR'
  | 'INTERNAL_ERROR';

/** Unified error body returned by the map-service (`ApiErrorResponse`). */
export interface MapApiErrorBody {
  code: MapErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Error broadcast over the `/user/queue/map-errors` STOMP queue
 * (`MapErrorMessage`): the shared body plus an envelope `type` and the
 * `requestId` of the command that failed (for client/server correlation).
 */
export interface MapWsErrorMessage extends MapApiErrorBody {
  type: 'MAP_ERROR';
  requestId?: string | null;
}

/** Normalized error the FE works with, regardless of REST/WS origin. */
export interface MapApiError extends MapApiErrorBody {
  /** HTTP status when the error came from a REST call. */
  status?: number;
  /** Correlation id when the error came from a WS command. */
  requestId?: string;
}
