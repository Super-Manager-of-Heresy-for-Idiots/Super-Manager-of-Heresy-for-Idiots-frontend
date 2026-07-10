import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/store/authStore';
import { ensureFreshAccessToken, refreshSession } from '@/lib/authSession';
import { attachCsrfHeader, ensureCsrfToken } from '@/lib/csrf';
import { installUnsafeRequestCoalescing, isUnsafeMethod } from '@/lib/httpMutationDedupe';
import { getStoredLang } from '@/i18n/lang';
import { markNetworkRequestStarted, recordNetworkFailure, recordNetworkSuccess } from '@/lib/bugReport';

const api = axios.create({
  baseURL: '/api',
  // Send the HttpOnly session cookies (access_token / refresh_token) on every
  // request — REST authorization is cookie-based now.
  withCredentials: true,
  // CSRF double-submit (Spring default names): axios copies the XSRF-TOKEN cookie
  // into the X-XSRF-TOKEN header on same-origin requests when withCredentials is
  // set. Safe to ship before the backend enables CSRF — with no cookie present
  // nothing is sent — so this half of the coordinated change is harmless on its own.
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Content-Type': 'application/json',
  },
});

installUnsafeRequestCoalescing(api);

/** Endpoints that must never trigger the reactive refresh (avoids 401→refresh→401 loops). */
function isAuthEndpoint(url: string | undefined): boolean {
  if (!url) return false;
  return url.includes('/auth/login')
    || url.includes('/auth/refresh')
    || url.includes('/auth/logout')
    || url.includes('/auth/switch');
}

function shouldAttachLangParam(url: string | undefined): boolean {
  return Boolean(url) && !isAuthEndpoint(url);
}

api.interceptors.request.use(async (config) => {
  markNetworkRequestStarted(config);
  if (isUnsafeMethod(config.method)) {
    const csrfToken = await ensureCsrfToken();
    attachCsrfHeader(config.headers, csrfToken);
  }
  // The access token is also sent in the Authorization header. REST is authorized by
  // cookie; this header is the auth path for setups where the cookie can't ride along
  // and is a harmless fallback otherwise.
  const token = isAuthEndpoint(config.url)
    ? useAuthStore.getState().token
    : await ensureFreshAccessToken();
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Every core API response that can feed the UI is language-scoped. Some
  // current entities still have no localized columns, but keeping `lang` on the
  // request makes cache/request behavior correct when server-side localization
  // is added and avoids stale UI data after switching languages.
  if (shouldAttachLangParam(config.url)) {
    config.params = { ...config.params, lang: config.params?.lang ?? getStoredLang() };
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    recordNetworkSuccess(response);
    if (response.data && response.data.success === false) {
      const error = new Error(response.data.message || 'Request failed') as Error & {
        response?: typeof response;
      };
      error.response = response;
      return Promise.reject(error);
    }
    return response;
  },
  async (error: AxiosError) => {
    recordNetworkFailure(error);
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    const status = error.response?.status;

    // Seamless auto-refresh: on the first 401 of a protected request, run a single
    // shared refresh and replay the original request. Concurrent 401s coalesce onto
    // the same in-flight refresh (single-flight lives in refreshSession).
    if (status === 401 && original && !original._retry && !isAuthEndpoint(original.url)) {
      original._retry = true;
      const newToken = await refreshSession();
      if (newToken) {
        return api(original);
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

export default api;
