/**
 * Vite dev-server proxy table (audit MAP-07). Shared by `vite.config.ts` and tests.
 *
 * Same-origin routing: the browser talks only to the Vite origin (:5173), so map
 * REST/WS calls are NOT cross-origin to the map-service (:8081) and skip CORS
 * preflight. Map-service prefixes are listed BEFORE the generic `/api` (core) entry —
 * http-proxy matches the first key the request path starts with, so the more specific
 * map routes must come first or they would be swallowed by `/api` → core.
 */
import type { ProxyOptions } from 'vite';

export const MAP_SERVICE_DEV_TARGET = 'http://localhost:8081';
export const MESSENGER_SERVICE_DEV_TARGET = 'http://localhost:8082';
export const CORE_BACKEND_DEV_TARGET = 'http://localhost:8080';

export const devProxy: Record<string, ProxyOptions> = {
  // ── map-service REST (must precede `/api`) ──────────────────────────────
  // Campaign-scoped maps as an anchored regex key so it does not capture other
  // `/api/campaigns/...` core endpoints.
  '^/api/campaigns/[^/]+/maps': { target: MAP_SERVICE_DEV_TARGET, changeOrigin: true },
  '/api/maps': { target: MAP_SERVICE_DEV_TARGET, changeOrigin: true },
  '/api/map-sessions': { target: MAP_SERVICE_DEV_TARGET, changeOrigin: true },
  '/api/map-assets': { target: MAP_SERVICE_DEV_TARGET, changeOrigin: true },

  // ── map-service realtime (native WebSocket; must precede `/ws`) ──────────
  '/ws/map': { target: MAP_SERVICE_DEV_TARGET, changeOrigin: true, ws: true },

  // ── messenger-service REST + realtime (must precede the generic `/api` & `/ws`) ──
  '/api/chat-sessions': { target: MESSENGER_SERVICE_DEV_TARGET, changeOrigin: true },
  '/ws/messenger': { target: MESSENGER_SERVICE_DEV_TARGET, changeOrigin: true, ws: true },

  // ── core backend REST + realtime ────────────────────────────────────────
  '/api': { target: CORE_BACKEND_DEV_TARGET, changeOrigin: true },
  '/ws': { target: CORE_BACKEND_DEV_TARGET, changeOrigin: true, ws: true },
};
