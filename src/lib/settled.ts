/**
 * Extracts the list payload from a `Promise.allSettled` result for an
 * `ApiResponse<T[]>` call, defaulting to `[]` when that call rejected. Lets a
 * batch of independent reference fetches tolerate individual failures instead of
 * collapsing the whole batch (one 500 must not blank the others).
 */
export function settledList<T>(result: PromiseSettledResult<{ data?: T[] }>): T[] {
  return result.status === 'fulfilled' ? (result.value.data ?? []) : [];
}
