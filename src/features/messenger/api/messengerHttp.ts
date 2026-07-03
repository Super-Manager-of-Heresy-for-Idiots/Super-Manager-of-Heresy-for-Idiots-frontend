import axios from 'axios';
import { ensureFreshAccessToken } from '@/lib/authSession';
import { MESSENGER_API_BASE_URL } from './messengerApiConfig';

/**
 * Dedicated axios instance for the messenger service (kept separate from the core `src/api/axios.ts`).
 * The messenger is an OAuth2 resource server that reads identity from the `Authorization: Bearer`
 * header (not the HttpOnly cookie), so every request attaches a fresh access token. CSRF is disabled
 * on the messenger, so no XSRF header is needed.
 */
const messengerHttp = axios.create({
  baseURL: MESSENGER_API_BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

messengerHttp.interceptors.request.use(async (config) => {
  const token = await ensureFreshAccessToken();
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default messengerHttp;
