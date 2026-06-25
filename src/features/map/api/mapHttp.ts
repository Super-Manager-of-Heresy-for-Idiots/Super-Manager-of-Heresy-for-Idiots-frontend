import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { refreshSession } from '@/lib/authSession';
import { MAP_API_BASE_URL } from './mapApiConfig';
import { buildMapAuthHeaders } from './mapAuthHeaders';

export { MAP_API_BASE_URL } from './mapApiConfig';

/**
 * Dedicated HTTP client for the map-service.
 *
 * The map-service is a SEPARATE Spring application from the core backend, so its
 * calls are kept off the core `@/api/axios` instance (global rule: do not mix
 * map-service calls into core clients). It still reuses the EXACT same auth as the
 * rest of the app — there is no second login flow:
 *  - `withCredentials` sends the HttpOnly session cookies (the gateway authenticates
 *    these and injects the `X-User-Id`/`X-Username`/`X-Authorities` headers the
 *    map-service reads);
 *  - the in-memory access token rides along as a `Bearer` header fallback;
 *  - a 401 triggers the same single-flight {@link refreshSession} and replays once.
 *
 * Cookies stay enabled for gateway deployments, but direct map asset rendering uses
 * `mapApi.assets.content()` so the request can include `X-User-Id`.
 */

const mapHttp = axios.create({
  baseURL: MAP_API_BASE_URL,
  withCredentials: true,
  // CSRF double-submit (Spring default cookie/header names), mirroring core axios.
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  // NB: no default `Content-Type` header on purpose — axios picks
  // `application/json` for plain bodies and the correct `multipart/form-data;
  // boundary=…` for the asset-upload FormData. A forced JSON default would break
  // the multipart upload.
});

/** Auth endpoints must never trigger reactive refresh (avoids 401→refresh→401). */
function isAuthEndpoint(url: string | undefined): boolean {
  return !!url && url.includes('/auth/');
}

mapHttp.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  Object.assign(config.headers, buildMapAuthHeaders());
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

mapHttp.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      const newToken = await refreshSession();
      if (newToken) {
        return mapHttp(original);
      }
      // Refresh failed → the session is gone. Clear state and bounce to login.
      useAuthStore.getState().logout();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default mapHttp;
