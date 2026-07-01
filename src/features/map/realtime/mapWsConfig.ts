/**
 * Pure WebSocket config — no store/transport imports, safe to import anywhere.
 *
 * Transport decision (audit MAP-06): the map-service registers its STOMP endpoint
 * with `addEndpoint("/ws/map")` and NO `.withSockJS()`, so it speaks plain native
 * WebSocket. The client therefore uses stompjs `brokerURL` (native `WebSocket`), not
 * SockJS. The broker URL must be a `ws://`/`wss://` URL.
 *
 * Resolution order:
 *  1. `VITE_MAP_WS_URL` override (must be a full `ws(s)://…` URL);
 *  2. same-origin `ws(s)://<host>/ws/map`, derived from the page protocol — in dev
 *     the Vite proxy forwards `/ws/map` to the map-service (audit MAP-07), in prod
 *     nginx proxies it. Same-origin keeps it behind one auth/CSP boundary.
 */

/** Resolve the native STOMP broker URL for the map-service realtime channel. */
export function resolveMapWsUrl(): string {
  const override = import.meta.env.VITE_MAP_WS_URL as string | undefined;
  if (override) return override;

  if (typeof window !== 'undefined' && window.location?.host) {
    const scheme = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${scheme}//${window.location.host}/ws/map`;
  }

  // SSR/non-browser fallback (tests). stompjs only opens the socket in the browser.
  return 'ws://localhost/ws/map';
}

/** Native STOMP broker URL (see {@link resolveMapWsUrl}). */
export const MAP_WS_URL = resolveMapWsUrl();
