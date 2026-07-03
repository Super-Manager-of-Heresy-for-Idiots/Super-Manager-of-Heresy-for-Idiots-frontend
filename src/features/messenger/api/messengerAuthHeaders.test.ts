import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InternalAxiosRequestConfig } from 'axios';

const storeState: { user: { id?: string; username?: string; role?: string } | null } = {
  user: null,
};

vi.mock('@/store/authStore', () => ({
  useAuthStore: { getState: () => storeState },
}));

import {
  buildBearerAuthHeader,
  buildDevMessengerIdentityHeaders,
  isDevMessengerIdentityEnabled,
} from './messengerAuthHeaders';
import { attachMessengerAuth } from './messengerHttp';

const FORGED_HEADERS = ['X-User-Id', 'X-Username', 'X-Authorities', 'userId'];

function runAttach(token: string | null | undefined): Record<string, unknown> {
  const config = { headers: {} } as unknown as InternalAxiosRequestConfig;
  return attachMessengerAuth(config, token).headers as unknown as Record<string, unknown>;
}

beforeEach(() => {
  storeState.user = null;
});

afterEach(() => {
  vi.unstubAllEnvs();
});

describe('messenger auth headers', () => {
  it('emits Authorization: Bearer when a real token is held', () => {
    expect(buildBearerAuthHeader('jwt-abc')).toEqual({ Authorization: 'Bearer jwt-abc' });
  });

  it('emits nothing for missing / sentinel tokens', () => {
    expect(buildBearerAuthHeader(null)).toEqual({});
    expect(buildBearerAuthHeader(undefined)).toEqual({});
    expect(buildBearerAuthHeader('undefined')).toEqual({});
    expect(buildBearerAuthHeader('null')).toEqual({});
  });

  it('keeps local identity disabled by default', () => {
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    expect(isDevMessengerIdentityEnabled()).toBe(false);
    expect(buildDevMessengerIdentityHeaders()).toEqual({});
  });

  it('attaches local identity only under the explicit messenger dev opt-in', () => {
    vi.stubEnv('VITE_MESSENGER_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };

    expect(isDevMessengerIdentityEnabled()).toBe(true);
    expect(buildDevMessengerIdentityHeaders()).toEqual({ 'X-User-Id': 'u1', 'X-Username': 'gm' });
    expect(buildDevMessengerIdentityHeaders()['X-Authorities']).toBeUndefined();
  });
});

describe('attachMessengerAuth', () => {
  it('does not forge identity headers in the default production path', () => {
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = runAttach('jwt-xyz');

    for (const header of FORGED_HEADERS) expect(headers[header]).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer jwt-xyz');
  });

  it('attaches local identity alongside Bearer when explicitly enabled', () => {
    vi.stubEnv('VITE_MESSENGER_DEV_IDENTITY', 'true');
    storeState.user = { id: 'u1', username: 'gm', role: 'GM' };
    const headers = runAttach('jwt-xyz');

    expect(headers['X-User-Id']).toBe('u1');
    expect(headers['X-Username']).toBe('gm');
    expect(headers['X-Authorities']).toBeUndefined();
    expect(headers.userId).toBeUndefined();
    expect(headers.Authorization).toBe('Bearer jwt-xyz');
  });
});
