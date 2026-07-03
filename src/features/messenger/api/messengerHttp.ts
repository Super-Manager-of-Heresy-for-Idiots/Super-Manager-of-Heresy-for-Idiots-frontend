import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import { ensureFreshAccessToken } from '@/lib/authSession';
import { buildBearerAuthHeader, buildDevMessengerIdentityHeaders } from './messengerAuthHeaders';
import { MESSENGER_API_BASE_URL } from './messengerApiConfig';

/**
 * Dedicated axios instance for the messenger service (kept separate from the core `src/api/axios.ts`).
 * Production identity comes from `Authorization: Bearer`; local/test messenger profiles can opt into
 * explicit `X-User-*` identity headers, matching the map-service local auth boundary.
 */
const messengerHttp = axios.create({
  baseURL: MESSENGER_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

export function attachMessengerAuth<T extends InternalAxiosRequestConfig>(
  config: T,
  token: string | null | undefined,
): T {
  Object.assign(config.headers, buildDevMessengerIdentityHeaders());
  Object.assign(config.headers, buildBearerAuthHeader(token));
  return config;
}

messengerHttp.interceptors.request.use(async (config) => {
  const token = await ensureFreshAccessToken();
  return attachMessengerAuth(config, token);
});

export default messengerHttp;
