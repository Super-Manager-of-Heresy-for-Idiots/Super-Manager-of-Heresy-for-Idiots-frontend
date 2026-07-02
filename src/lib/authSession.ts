import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ensureCsrfToken } from '@/lib/csrf';
import type { UserResponse } from '@/types';

/**
 * Centralized JWT session lifecycle: silent access-token refresh and app-start
 * session restore. The session is carried by HttpOnly cookies (access + refresh);
 * the access token is also returned in the body so we can hold it in memory for
 * the WebSocket handshake.
 *
 * The refresh call deliberately uses the RAW axios (not the shared `api` instance):
 *  - it must bypass the `api` response interceptor, otherwise a 401 on /refresh would
 *    recurse into another refresh;
 *  - keeping it here (not in auth.api.ts) avoids an import cycle with `api`.
 */

interface ParsedAuth {
  token: string;
  expiresIn: number;
  user: UserResponse;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? (value as Record<string, unknown>) : {};
}

/** Tolerant parse of the auth envelope `{ success, data: { token, expiresIn, user } }`. */
function parseAuth(body: unknown): ParsedAuth | null {
  const root = asRecord(body);
  const payload = asRecord(root.data ?? root);
  const tokenValue = payload.token ?? payload.accessToken ?? payload.jwt;
  const token = typeof tokenValue === 'string' ? tokenValue : null;
  const user = (payload.user ?? root.user) as UserResponse | undefined;
  const expiresInValue = payload.expiresIn;
  const expiresIn = typeof expiresInValue === 'number' ? expiresInValue : 0;
  if (!token || !user) return null;
  return { token, expiresIn, user };
}

let refreshPromise: Promise<string | null> | null = null;
let proactiveTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Exchange the refresh cookie for a fresh access token. Single-flight: concurrent
 * callers (e.g. a burst of 401s) all await the same in-flight request. Resolves to
 * the new access token, or `null` if the refresh failed (caller should log out).
 */
export function refreshSession(): Promise<string | null> {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    try {
      // No body — the browser sends the refresh_token cookie automatically.
      const res = await axios.post('/api/auth/refresh', null, {
        withCredentials: true,
        xsrfCookieName: 'XSRF-TOKEN',
        xsrfHeaderName: 'X-XSRF-TOKEN',
      });
      const parsed = parseAuth(res.data);
      if (!parsed) return null;

      useAuthStore.getState().login(parsed.user, parsed.token);
      scheduleProactiveRefresh(parsed.expiresIn);
      await ensureCsrfToken(true);
      // The live socket re-handshakes on its own: stompjs auto-reconnect pulls a
      // fresh token via ensureFreshAccessToken() in beforeConnect. No explicit
      // wsService call here — that would recurse through beforeConnect.
      return parsed.token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

/** Decode a JWT's `exp` claim to epoch-ms. Returns null for opaque/garbage tokens. */
function readJwtExpiryMs(token: string): number | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  try {
    const json = atob(parts[1].replace(/-/g, '+').replace(/_/g, '/'));
    const payload = JSON.parse(json) as { exp?: number };
    return typeof payload.exp === 'number' ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
}

/**
 * Return a valid access token for the WebSocket handshake, refreshing first only
 * when the in-memory token is missing or about to lapse. Reuses the single-flight
 * {@link refreshSession} so a (re)connect attempt never races a REST-triggered
 * refresh — two parallel refreshes on one rotating cookie would kill the session.
 */
export async function ensureFreshAccessToken(): Promise<string | null> {
  const token = useAuthStore.getState().token;
  if (token) {
    const exp = readJwtExpiryMs(token);
    // No exp readable → trust it and let the server reject if stale.
    if (exp == null || exp - Date.now() > 30_000) return token;
  }
  return refreshSession();
}

/**
 * Schedule a proactive refresh ~1 minute before the access token expires, so an
 * active tab never hits a 401 in the first place. Replaces any pending timer.
 */
export function scheduleProactiveRefresh(expiresInMs: number): void {
  cancelProactiveRefresh();
  if (!expiresInMs || expiresInMs <= 0) return;
  // Fire 60s early, but never sooner than 5s from now (guards tiny/odd TTLs).
  const delay = Math.max(expiresInMs - 60_000, 5_000);
  proactiveTimer = setTimeout(() => {
    void refreshSession();
  }, delay);
}

export function cancelProactiveRefresh(): void {
  if (proactiveTimer) {
    clearTimeout(proactiveTimer);
    proactiveTimer = null;
  }
}

/**
 * App-start session restore. If a valid refresh cookie exists the user is silently
 * logged back in; otherwise they land on the login screen. Always flips `authReady`
 * so the router can mount.
 */
export async function bootstrapAuth(): Promise<void> {
  try {
    await refreshSession();
    await ensureCsrfToken();
  } finally {
    useAuthStore.getState().setAuthReady(true);
  }
}
