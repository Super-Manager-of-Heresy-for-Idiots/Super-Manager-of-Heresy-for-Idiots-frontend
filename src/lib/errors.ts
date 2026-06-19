import { AxiosError } from 'axios';

/**
 * Whether retrying a failed request could plausibly succeed. Only server faults
 * (5xx) and transport failures (no response at all) are retryable; 4xx outcomes
 * — permission (403), not-found (404), validation (4xx) — won't change on retry,
 * so a "retry" affordance there is misleading. Non-axios errors default to
 * retryable so existing retry UI is never silently removed.
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    if (status === undefined) return true;
    return status >= 500;
  }
  return true;
}
