/**
 * Pure WebSocket config - no store/SockJS imports, safe to import anywhere.
 *
 * SockJS endpoint for the map-service realtime channel. Local dev follows the
 * map-service contract directly (`http://localhost:8081/ws/map`) so Vite's core
 * `/ws` proxy cannot misroute it. Production falls back to `/ws/map` for gateway
 * deployments. Override with `VITE_MAP_WS_URL`.
 */
export const MAP_WS_URL =
  (import.meta.env.VITE_MAP_WS_URL as string | undefined) ??
  (import.meta.env.DEV ? 'http://localhost:8081/ws/map' : '/ws/map');
