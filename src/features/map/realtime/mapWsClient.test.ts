import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * WebSocket auth/transport tests (audit MAP-04 / MAP-06). Mock the auth store (node
 * env has no localStorage) and assert the pure header/URL helpers the client uses.
 */
const storeState: { token: string | null; user: { id?: string; username?: string; role?: string } | null } = {
  token: null,
  user: null,
};
vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => storeState },
}));

import { resolveMapWsUrl } from './mapWsConfig';
import { buildMapConnectHeaders, buildMapSendHeaders } from './mapStompClient';

const FORGED_HEADERS = ['X-User-Id', 'X-Username', 'X-Authorities', 'userId'];

beforeEach(() => {
  storeState.token = null;
  storeState.user = null;
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('resolveMapWsUrl (native WebSocket transport)', () => {
  it('resolves a native ws:// or wss:// broker URL, not an http SockJS URL', () => {
    const url = resolveMapWsUrl();
    expect(url).toMatch(/^wss?:\/\//);
    expect(url.startsWith('http')).toBe(false);
    expect(url.endsWith('/ws/map')).toBe(true);
  });

  it('honours the VITE_MAP_WS_URL override', () => {
    vi.stubEnv('VITE_MAP_WS_URL', 'wss://example.test/ws/map');
    expect(resolveMapWsUrl()).toBe('wss://example.test/ws/map');
  });
});

describe('buildMapConnectHeaders (STOMP CONNECT)', () => {
  it('carries Authorization: Bearer and no forged identity headers', () => {
    const headers = buildMapConnectHeaders('jwt-abc');
    expect(headers.Authorization).toBe('Bearer jwt-abc');
    for (const h of FORGED_HEADERS) expect(headers[h]).toBeUndefined();
  });

  it('is empty when no token is held (no identity, no auth)', () => {
    expect(buildMapConnectHeaders(null)).toEqual({});
  });

  it('can add local identity in Docker build when the explicit flag is set', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = buildMapConnectHeaders('jwt-abc');
    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Username']).toBe('gm');
    expect(headers['X-Authorities']).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer jwt-abc');
  });

  it('adds X-User-Id (never X-Authorities/userId) under the dev opt-in', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = buildMapConnectHeaders('jwt-abc');
    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Username']).toBe('gm');
    expect(headers['X-Authorities']).toBeUndefined();
    expect(headers.userId).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer jwt-abc');
  });
});

describe('buildMapSendHeaders (STOMP SEND)', () => {
  it('carries no identity headers by default (principal is bound at CONNECT)', () => {
    expect(buildMapSendHeaders()).toEqual({});
  });

  it('carries only the dev identity shim under the dev opt-in', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = buildMapSendHeaders();
    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Authorities']).toBeUndefined();
    expect(headers.Authorization).toBeUndefined();
  });
});
