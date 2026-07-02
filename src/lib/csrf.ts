import axios from 'axios';

const CSRF_COOKIE = 'XSRF-TOKEN';
const CSRF_HEADER = 'X-XSRF-TOKEN';

let csrfPromise: Promise<string | null> | null = null;

export function readCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = `${CSRF_COOKIE}=`;
  const cookie = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(prefix));
  if (!cookie) return null;

  try {
    return decodeURIComponent(cookie.slice(prefix.length));
  } catch {
    return cookie.slice(prefix.length);
  }
}

export async function ensureCsrfToken(force = false): Promise<string | null> {
  const current = readCsrfToken();
  if (current && !force) return current;
  if (csrfPromise) return csrfPromise;

  csrfPromise = axios
    .get('/api/auth/csrf', {
      withCredentials: true,
      xsrfCookieName: CSRF_COOKIE,
      xsrfHeaderName: CSRF_HEADER,
    })
    .then(() => readCsrfToken())
    .catch(() => readCsrfToken())
    .finally(() => {
      csrfPromise = null;
    });

  return csrfPromise;
}

export function attachCsrfHeader(headers: unknown, token: string | null): void {
  if (!token || !headers || typeof headers !== 'object') return;
  const maybeAxiosHeaders = headers as { set?: (name: string, value: string) => void };
  if (typeof maybeAxiosHeaders.set === 'function') {
    maybeAxiosHeaders.set(CSRF_HEADER, token);
    return;
  }
  (headers as Record<string, string>)[CSRF_HEADER] = token;
}
