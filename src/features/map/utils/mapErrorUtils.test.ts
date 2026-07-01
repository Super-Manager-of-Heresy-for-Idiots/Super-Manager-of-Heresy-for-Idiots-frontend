import { AxiosError, type AxiosResponse } from 'axios';
import { describe, it, expect } from 'vitest';
import {
  isForbidden,
  isMapSessionClosed,
  isNotFound,
  isRevisionConflict,
  isTokenLocked,
  isUnauthorized,
  mapErrorCode,
  mapErrorI18nKey,
  parseMapApiError,
  toMapUserMessage,
} from './mapErrorUtils';
import { MAP_API_BASE_URL, mapAssetContentUrl } from '../api/mapApiConfig';

/** Build an AxiosError carrying the given HTTP status + JSON body. */
function restError(status: number, data: unknown): AxiosError {
  const err = new AxiosError('Request failed');
  err.response = { status, data, statusText: '', headers: {}, config: {} } as AxiosResponse;
  return err;
}

describe('parseMapApiError', () => {
  it('extracts code/message/details and status from a REST error body', () => {
    const err = restError(409, {
      code: 'REVISION_CONFLICT',
      message: 'stale',
      details: { serverRevision: 7 },
    });
    expect(parseMapApiError(err)).toEqual({
      code: 'REVISION_CONFLICT',
      message: 'stale',
      details: { serverRevision: 7 },
      status: 409,
    });
  });

  it('parses a raw WebSocket MapErrorMessage object', () => {
    const wsError = {
      type: 'MAP_ERROR',
      requestId: 'req-1',
      code: 'SESSION_CLOSED',
      message: 'closed',
    };
    expect(parseMapApiError(wsError)).toEqual({
      code: 'SESSION_CLOSED',
      message: 'closed',
      requestId: 'req-1',
      details: undefined,
    });
  });

  it('synthesizes INTERNAL_ERROR when there is no response (transport failure)', () => {
    const err = new AxiosError('Network Error');
    expect(parseMapApiError(err)).toEqual({ code: 'INTERNAL_ERROR', message: 'Network Error' });
  });

  it('returns null for an unrecognized error body (e.g. gateway HTML)', () => {
    expect(parseMapApiError(restError(502, '<html>Bad Gateway</html>'))).toBeNull();
    expect(parseMapApiError(new Error('boom'))).toBeNull();
    expect(parseMapApiError(restError(400, { code: 'NOT_A_MAP_CODE' }))).toBeNull();
  });
});

describe('predicates', () => {
  it('isRevisionConflict only matches REVISION_CONFLICT', () => {
    expect(isRevisionConflict(restError(409, { code: 'REVISION_CONFLICT', message: '' }))).toBe(true);
    expect(isRevisionConflict(restError(403, { code: 'FORBIDDEN', message: '' }))).toBe(false);
  });

  it('isForbidden distinguishes FORBIDDEN from the also-403 TOKEN_LOCKED', () => {
    expect(isForbidden(restError(403, { code: 'FORBIDDEN', message: '' }))).toBe(true);
    expect(isForbidden(restError(403, { code: 'TOKEN_LOCKED', message: '' }))).toBe(false);
    expect(isTokenLocked(restError(403, { code: 'TOKEN_LOCKED', message: '' }))).toBe(true);
  });

  it('falls back to HTTP status when the body is not a map error', () => {
    expect(isForbidden(restError(403, 'nope'))).toBe(true);
    expect(isNotFound(restError(404, 'nope'))).toBe(true);
    expect(isUnauthorized(restError(401, 'nope'))).toBe(true);
  });

  it('isMapSessionClosed matches SESSION_CLOSED', () => {
    expect(isMapSessionClosed({ code: 'SESSION_CLOSED', message: '' })).toBe(true);
  });
});

describe('message helpers', () => {
  it('mapErrorCode returns the code or null', () => {
    expect(mapErrorCode(restError(404, { code: 'NOT_FOUND', message: '' }))).toBe('NOT_FOUND');
    expect(mapErrorCode('garbage')).toBeNull();
  });

  it('mapErrorI18nKey builds map.err.<CODE> with an UNKNOWN fallback', () => {
    expect(mapErrorI18nKey(restError(400, { code: 'INVALID_IMAGE', message: '' }))).toBe('map.err.INVALID_IMAGE');
    expect(mapErrorI18nKey({})).toBe('map.err.UNKNOWN');
  });

  it('toMapUserMessage prefers the backend message, then a humanized code', () => {
    expect(toMapUserMessage(restError(400, { code: 'ASSET_TOO_LARGE', message: 'Max 25 MB' }))).toBe('Max 25 MB');
    expect(toMapUserMessage({ code: 'ASSET_TOO_LARGE', message: '' })).toBe('asset too large');
    expect(toMapUserMessage(new Error('x'))).toBe('Map service request failed');
  });
});

describe('mapAssetContentUrl', () => {
  it('builds the content URL from the configured map API base', () => {
    expect(mapAssetContentUrl('asset-123')).toBe(`${MAP_API_BASE_URL}/map-assets/asset-123/content`);
  });
});
