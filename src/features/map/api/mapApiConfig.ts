/**
 * Pure map-service API configuration — no axios/store imports, so it is safe to
 * use from anywhere (including node unit tests) without dragging in the auth store.
 */

/**
 * Base path for map-service REST calls. Defaults to `/api` (same origin as core),
 * which assumes a gateway routes the map paths (`/api/map-assets`, `/api/maps`,
 * `/api/map-sessions`, `/api/campaigns/{id}/maps`) to the map-service. If the
 * gateway instead mounts the service under a distinct prefix (e.g. `/map-api`),
 * set `VITE_MAP_API_BASE_URL` — no call site changes.
 */
export const MAP_API_BASE_URL =
  (import.meta.env.VITE_MAP_API_BASE_URL as string | undefined) ??
  (import.meta.env.DEV ? 'http://localhost:8081/api' : '/api');

/**
 * Stable URL to an asset's binary content (GET /api/map-assets/{assetId}/content).
 * Prefer `mapApi.assets.content()` for rendered images so the request carries the
 * map-service auth headers.
 */
export function mapAssetContentUrl(assetId: string): string {
  return `${MAP_API_BASE_URL}/map-assets/${assetId}/content`;
}
