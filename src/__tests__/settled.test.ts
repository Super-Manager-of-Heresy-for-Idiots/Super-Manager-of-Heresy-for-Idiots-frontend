import { describe, it, expect } from 'vitest';
import { settledList } from '@/lib/settled';

describe('settledList', () => {
  it('returns the data array from a fulfilled result', () => {
    const result: PromiseSettledResult<{ data?: number[] }> = {
      status: 'fulfilled',
      value: { data: [1, 2, 3] },
    };
    expect(settledList(result)).toEqual([1, 2, 3]);
  });

  it('defaults to [] when a fulfilled result carries no data', () => {
    const result: PromiseSettledResult<{ data?: number[] }> = {
      status: 'fulfilled',
      value: {},
    };
    expect(settledList(result)).toEqual([]);
  });

  it('swallows a rejected result and yields []', () => {
    const result: PromiseSettledResult<{ data?: number[] }> = {
      status: 'rejected',
      reason: new Error('500'),
    };
    expect(settledList(result)).toEqual([]);
  });

  it('integrates with Promise.allSettled so one failure does not blank the batch', async () => {
    const ok = Promise.resolve({ data: ['a', 'b'] });
    const bad = Promise.reject<{ data?: string[] }>(new Error('boom'));
    const [r1, r2] = await Promise.allSettled([ok, bad]);
    expect(settledList(r1)).toEqual(['a', 'b']);
    expect(settledList(r2)).toEqual([]);
  });
});
