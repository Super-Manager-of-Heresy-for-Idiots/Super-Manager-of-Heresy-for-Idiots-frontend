import { useAuthStore } from '@/store/authStore';

export type MapAuthHeaders = Record<string, string>;

/**
 * Map-service auth boundary (audit MAP-01 / MAP-04).
 *
 * The browser MUST NOT forge user identity headers (`X-User-Id`, `X-Username`,
 * `X-Authorities`) to the map-service: anything the client can set, the client can
 * spoof. Production authenticates the SAME way as the core backend — the HttpOnly
 * session cookie plus the in-memory `Bearer` access token (see {@link buildBearerAuthHeader})
 * — and a trusted gateway/map-service derives identity from the validated JWT. The
 * frontend never sends authorities, ever.
 *
 * The one escape hatch is LOCAL development against a bare map-service that has no
 * gateway in front of it (its `local` profile resolves the user from a native
 * `X-User-Id` header). That is gated behind an EXPLICIT build-time opt-in flag.
 */

/** Local-only opt-in: false unless the build explicitly sets `VITE_MAP_DEV_IDENTITY=true`. */
export function isDevMapIdentityEnabled(): boolean {
  return import.meta.env.VITE_MAP_DEV_IDENTITY === 'true';
}

/**
 * Local-only fake identity headers for a gateway-less dev map-service. Returns `{}`
 * unless {@link isDevMapIdentityEnabled} — so it is a no-op in production and in any
 * dev build that has not explicitly opted in. Never emits `X-Authorities`: the
 * map-service `local` profile does not need authorities, and the frontend is never a
 * source of truth for them.
 */
export function buildDevMapIdentityHeaders(): MapAuthHeaders {
  if (!isDevMapIdentityEnabled()) return {};

  const user = useAuthStore.getState().user;
  const headers: MapAuthHeaders = {};
  if (user?.id) headers['X-User-Id'] = user.id;
  if (user?.username) headers['X-Username'] = user.username;
  return headers;
}

/**
 * The real production auth header: the in-memory access token as a `Bearer` token,
 * mirroring the core backend's WS/REST contract. Returns `{}` when no token is held
 * (REST still carries the HttpOnly cookie via `withCredentials`).
 */
export function buildBearerAuthHeader(token: string | null | undefined): MapAuthHeaders {
  if (!token || token === 'undefined' || token === 'null') return {};
  return { Authorization: `Bearer ${token}` };
}
