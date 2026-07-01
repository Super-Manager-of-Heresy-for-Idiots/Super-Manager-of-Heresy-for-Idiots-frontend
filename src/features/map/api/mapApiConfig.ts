/**
 * Pure map-service API configuration — no axios/store imports, so it is safe to
 * use from anywhere (including node unit tests) without dragging in the auth store.
 */

/**
 * Base path for map-service REST calls. Defaults to same-origin `/api` in BOTH dev
 * and prod (audit MAP-07): dev relies on the Vite proxy forwarding the map paths
 * (`/api/map-assets`, `/api/maps`, `/api/map-sessions`, `/api/campaigns/{id}/maps`)
 * to the map-service, and prod relies on nginx — so the browser never makes a
 * cross-origin call to `localhost:8081` (no CORS preflight, one auth/CSP boundary).
 * If the gateway mounts the service under a distinct prefix (e.g. `/map-api`), set
 * `VITE_MAP_API_BASE_URL` — no call site changes.
 */
export const MAP_API_BASE_URL =
  (import.meta.env.VITE_MAP_API_BASE_URL as string | undefined) ?? '/api';

/**
 * Stable, same-origin URL to an asset's binary content
 * (GET /api/map-assets/{assetId}/content). This is the BROWSER-SAFE delivery path —
 * prefer `mapApi.assets.content()` for rendered images so the request carries auth.
 */
export function mapAssetContentUrl(assetId: string): string {
  return `${MAP_API_BASE_URL}/map-assets/${assetId}/content`;
}

/**
 * True when a URL points at an internal-only object store (e.g. MinIO service DNS)
 * that a browser cannot resolve (audit MAP-13). Presigned URLs like
 * `http://map-minio:9000/...` are valid only inside the cluster and must never be
 * used directly for rendering or download from the browser.
 */
export function isBrowserUnsafeAssetUrl(url: string | null | undefined): boolean {
  if (!url) return true;
  // Internal docker/k8s hostnames the browser cannot reach.
  return /^https?:\/\/(map-minio|minio|[a-z0-9-]+\.(svc|internal|local|cluster\.local))(:\d+)?(\/|$)/i.test(
    url,
  );
}

/**
 * Resolve a browser-safe URL for an asset's image content. Always prefers the
 * same-origin content endpoint; a server-supplied `downloadUrl` is used only when it
 * is itself browser-resolvable (it is normally the relative content path). An internal
 * MinIO/presigned URL is never returned to the browser.
 */
export function browserSafeAssetUrl(asset: {
  id: string;
  downloadUrl?: string | null;
}): string {
  if (asset.downloadUrl && !isBrowserUnsafeAssetUrl(asset.downloadUrl)) {
    return asset.downloadUrl;
  }
  return mapAssetContentUrl(asset.id);
}
