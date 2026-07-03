import { useAuthStore } from '@/store/authStore';

export type MessengerAuthHeaders = Record<string, string>;

export function buildBearerAuthHeader(token: string | null | undefined): MessengerAuthHeaders {
  if (!token || token === 'undefined' || token === 'null') return {};
  return { Authorization: `Bearer ${token}` };
}

export function isDevMessengerIdentityEnabled(): boolean {
  return import.meta.env.VITE_MESSENGER_DEV_IDENTITY === 'true';
}

export function buildDevMessengerIdentityHeaders(): MessengerAuthHeaders {
  if (!isDevMessengerIdentityEnabled()) return {};

  const user = useAuthStore.getState().user;
  const headers: MessengerAuthHeaders = {};
  if (user?.id) headers['X-User-Id'] = user.id;
  if (user?.username) headers['X-Username'] = user.username;
  return headers;
}
