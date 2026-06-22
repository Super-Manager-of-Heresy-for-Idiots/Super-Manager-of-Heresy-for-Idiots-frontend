import axios from 'axios';
import { useAuthStore } from '@/store/authStore';
import { wsService } from '@/lib/websocket';
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
      const res = await axios.post('/api/auth/refresh', null, { withCredentials: true });
      const parsed = parseAuth(res.data);
      if (!parsed) return null;

      useAuthStore.getState().login(parsed.user, parsed.token);
      scheduleProactiveRefresh(parsed.expiresIn);
      // Re-handshake the live socket with the new token (no-op if not connected).
      wsService.reconnect();
      return parsed.token;
    } catch {
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
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
  } finally {
    useAuthStore.getState().setAuthReady(true);
  }
}
