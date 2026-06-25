import { useAuthStore } from '@/store/authStore';

export type MapAuthHeaders = Record<string, string>;

/**
 * map-service resolves auth from these native headers, not from the core API's
 * bearer token contract. The same helper is used for REST and every STOMP frame.
 */
export function buildMapAuthHeaders(): MapAuthHeaders {
  const user = useAuthStore.getState().user;
  const headers: MapAuthHeaders = {};

  if (user?.id) headers['X-User-Id'] = user.id;
  if (user?.username) headers['X-Username'] = user.username;
  if (user?.role) headers['X-Authorities'] = user.role;

  return headers;
}
