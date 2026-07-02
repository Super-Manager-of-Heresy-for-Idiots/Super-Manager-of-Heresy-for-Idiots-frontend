import { AxiosError } from 'axios';
import type { MapApiError, MapApiErrorBody, MapErrorCode } from '../types';

/**
 * Adapter that turns any map-service failure — a REST `AxiosError`, a raw WS
 * `MapErrorMessage`, or an already-normalized error — into a single shape the UI
 * can branch on, plus typed predicates for the cases that drive recovery
 * (resync, cancel drag, disable actions). Never surfaces stack traces.
 */

const MAP_ERROR_CODES: ReadonlySet<string> = new Set<MapErrorCode>([
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'ASSET_TOO_LARGE',
  'UNSUPPORTED_CONTENT_TYPE',
  'INVALID_IMAGE',
  'GRID_CONFIG_INVALID',
  'REVISION_CONFLICT',
  'CONFLICT',
  'TOKEN_LOCKED',
  'SESSION_CLOSED',
  'UPSTREAM_UNAVAILABLE',
  'UPSTREAM_PROTOCOL_ERROR',
  'INTERNAL_ERROR',
]);

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

/** Read a `{ code, message, details }` body if it looks like a map-service error. */
function asErrorBody(body: unknown): MapApiErrorBody | null {
  if (!isRecord(body)) return null;
  const code = body.code;
  if (typeof code !== 'string' || !MAP_ERROR_CODES.has(code)) return null;
  return {
    code: code as MapErrorCode,
    message: typeof body.message === 'string' ? body.message : '',
    details: isRecord(body.details) ? body.details : undefined,
  };
}

/**
 * Normalize a thrown value into a {@link MapApiError}, or `null` when it is not a
 * recognizable map-service error (e.g. a gateway HTML 502 — deliberately not
 * surfaced so its body never leaks to the user).
 */
export function parseMapApiError(error: unknown): MapApiError | null {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const body = asErrorBody(error.response?.data);
    if (body) return { ...body, status };
    // No response at all → transport failure (map-service unreachable, CORS, …).
    if (error.response === undefined) {
      return { code: 'INTERNAL_ERROR', message: error.message };
    }
    return null;
  }
  // WS error message or an already-normalized error object.
  const body = asErrorBody(error);
  if (body) {
    const requestId =
      isRecord(error) && typeof error.requestId === 'string' ? error.requestId : undefined;
    return { ...body, requestId };
  }
  return null;
}

/** The map error code, or `null` if the value is not a map-service error. */
export function mapErrorCode(error: unknown): MapErrorCode | null {
  return parseMapApiError(error)?.code ?? null;
}

/** Raw HTTP status of an AxiosError, regardless of body shape. */
function httpStatusOf(error: unknown): number | undefined {
  return error instanceof AxiosError ? error.response?.status : undefined;
}

/** 409 REVISION_CONFLICT → caller must reload the snapshot. */
export function isRevisionConflict(error: unknown): boolean {
  return mapErrorCode(error) === 'REVISION_CONFLICT';
}

/** 403 FORBIDDEN (distinct from TOKEN_LOCKED, which is also HTTP 403). */
export function isForbidden(error: unknown): boolean {
  const code = mapErrorCode(error);
  if (code) return code === 'FORBIDDEN';
  return httpStatusOf(error) === 403;
}

/** TOKEN_LOCKED → caller must return the token to its committed position. */
export function isTokenLocked(error: unknown): boolean {
  return mapErrorCode(error) === 'TOKEN_LOCKED';
}

/** SESSION_CLOSED → caller must disable movement and show closed state. */
export function isMapSessionClosed(error: unknown): boolean {
  return mapErrorCode(error) === 'SESSION_CLOSED';
}

/** 404 NOT_FOUND → caller should show a not-found screen. */
export function isNotFound(error: unknown): boolean {
  const code = mapErrorCode(error);
  if (code) return code === 'NOT_FOUND';
  return httpStatusOf(error) === 404;
}

/** 401 UNAUTHORIZED → session expired (the HTTP layer already retries once). */
export function isUnauthorized(error: unknown): boolean {
  const code = mapErrorCode(error);
  if (code) return code === 'UNAUTHORIZED';
  return httpStatusOf(error) === 401;
}

/**
 * Stable i18n key for a user-facing message; components resolve it via `useT()`.
 * Keys live under `map.err.*`; unrecognized errors fall back to `map.err.UNKNOWN`.
 */
export function mapErrorI18nKey(error: unknown): string {
  const code = mapErrorCode(error);
  return code ? `map.err.${code}` : 'map.err.UNKNOWN';
}

/**
 * Best-effort plain-text message WITHOUT i18n (logs / non-React contexts). Prefers
 * the backend-supplied message, then a humanized code, then a generic fallback.
 */
export function toMapUserMessage(error: unknown): string {
  const parsed = parseMapApiError(error);
  if (parsed?.message) return parsed.message;
  if (parsed?.code) return parsed.code.replace(/_/g, ' ').toLowerCase();
  return 'Map service request failed';
}
