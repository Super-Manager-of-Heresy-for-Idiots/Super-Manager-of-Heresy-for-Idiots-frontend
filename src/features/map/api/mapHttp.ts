import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { refreshSession } from '@/lib/authSession';
import { MAP_API_BASE_URL } from './mapApiConfig';
import { buildBearerAuthHeader, buildDevMapIdentityHeaders } from './mapAuthHeaders';

export { MAP_API_BASE_URL } from './mapApiConfig';

/**
 * Dedicated HTTP client for the map-service.
 *
 * The map-service is a SEPARATE Spring application from the core backend, so its
 * calls are kept off the core `@/api/axios` instance (global rule: do not mix
 * map-service calls into core clients). It still reuses the EXACT same auth as the
 * rest of the app — there is no second login flow:
 *  - `withCredentials` sends the HttpOnly session cookies, authenticated at the edge
 *    (the trusted gateway/map-service validates them and derives identity);
 *  - the in-memory access token rides along as the `Authorization: Bearer` header,
 *    mirroring the core WS/REST contract;
 *  - a 401 triggers the same single-flight {@link refreshSession} and replays once.
 *
 * The browser NEVER forges `X-User-Id`/`X-Username`/`X-Authorities` (audit MAP-01):
 * identity comes from the validated session, not from client-set headers. The only
 * exception is a local, opt-in dev shim ({@link buildDevMapIdentityHeaders}), which
 * is compiled out of production builds.
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

/**
 * Request interceptor (exported for unit tests): attach the production auth header
 * (`Authorization: Bearer …`) plus the opt-in dev identity shim (a no-op in prod).
 * Never attaches forged `X-User-Id`/`X-Username`/`X-Authorities` in a prod build.
 */
export function attachMapAuth<T extends InternalAxiosRequestConfig>(config: T): T {
  const token = useAuthStore.getState().token;
  Object.assign(config.headers, buildDevMapIdentityHeaders());
  Object.assign(config.headers, buildBearerAuthHeader(token));
  return config;
}

mapHttp.interceptors.request.use(attachMapAuth);

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
