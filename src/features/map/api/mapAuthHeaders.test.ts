import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

/**
 * Auth-boundary tests (audit MAP-01). The node test env has no `localStorage`, so the
 * real auth store is never imported — a mutable mock stands in for `useAuthStore`.
 */
const storeState: { token: string | null; user: { id?: string; username?: string; role?: string } | null } = {
  token: null,
  user: null,
};
vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => storeState },
}));

import {
  buildBearerAuthHeader,
  buildDevMapIdentityHeaders,
  isDevMapIdentityEnabled,
} from './mapAuthHeaders';
import { attachMapAuth } from './mapHttp';

/** Identity headers the browser must never forge to the map-service. */
const FORGED_HEADERS = ['X-User-Id', 'X-Username', 'X-Authorities', 'userId'];

function runInterceptor(): Record<string, unknown> {
  const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
  return attachMapAuth(config).headers as unknown as Record<string, unknown>;
}

beforeEach(() => {
  storeState.token = null;
  storeState.user = null;
});
afterEach(() => {
  vi.unstubAllEnvs();
});

describe('buildBearerAuthHeader', () => {
  it('emits Authorization: Bearer when a real token is held', () => {
    expect(buildBearerAuthHeader('jwt-abc')).toEqual({ Authorization: 'Bearer jwt-abc' });
  });

  it('emits nothing for missing / sentinel tokens', () => {
    expect(buildBearerAuthHeader(null)).toEqual({});
    expect(buildBearerAuthHeader(undefined)).toEqual({});
    expect(buildBearerAuthHeader('undefined')).toEqual({});
    expect(buildBearerAuthHeader('null')).toEqual({});
  });
});

describe('dev identity shim gating', () => {
  it('is disabled by default (no forged identity headers)', () => {
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    expect(isDevMapIdentityEnabled()).toBe(false);
    expect(buildDevMapIdentityHeaders()).toEqual({});
  });

  it('can be enabled by explicit local Docker build flag even when Vite DEV is false', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    expect(isDevMapIdentityEnabled()).toBe(true);
    expect(buildDevMapIdentityHeaders()).toEqual({ 'X-User-Id': 'u1', 'X-Username': 'gm' });
  });

  it('requires the explicit opt-in flag', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', '');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    expect(isDevMapIdentityEnabled()).toBe(false);
    expect(buildDevMapIdentityHeaders()).toEqual({});
  });

  it('emits X-User-Id / X-Username (never X-Authorities) under the dev opt-in', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    expect(isDevMapIdentityEnabled()).toBe(true);
    expect(buildDevMapIdentityHeaders()).toEqual({ 'X-User-Id': 'u1', 'X-Username': 'gm' });
    expect(buildDevMapIdentityHeaders()['X-Authorities']).toBeUndefined();
  });
});

describe('attachMapAuth (mapHttp request interceptor)', () => {
  it('never forges identity headers in the default (production) path', () => {
    storeState.token = 'jwt-xyz';
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = runInterceptor();
    for (const h of FORGED_HEADERS) expect(headers[h]).toBeUndefined();
  });

  it('still attaches Authorization: Bearer from the in-memory token', () => {
    storeState.token = 'jwt-xyz';
    const headers = runInterceptor();
    expect(headers.Authorization).toBe('Bearer jwt-xyz');
  });

  it('omits Authorization when no token is held (cookie carries the session)', () => {
    const headers = runInterceptor();
    expect(headers.Authorization).toBeUndefined();
  });

  it('attaches local identity when the explicit local Docker build flag is set', () => {
    vi.stubEnv('DEV', false);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.token = 'jwt-xyz';
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = runInterceptor();
    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Username']).toBe('gm');
    expect(headers['X-Authorities']).toBeUndefined();
  });

  it('attaches the local X-User-Id ONLY under the explicit dev opt-in', () => {
    vi.stubEnv('DEV', true);
    vi.stubEnv('VITE_MAP_DEV_IDENTITY', 'true');
    storeState.token = 'jwt-xyz';
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = runInterceptor();
    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Username']).toBe('gm');
    expect(headers['X-Authorities']).toBeUndefined();
    expect(headers.userId).toBeUndefined();
    // Bearer is still attached alongside the dev shim.
    expect(headers.Authorization).toBe('Bearer jwt-xyz');
  });
});
