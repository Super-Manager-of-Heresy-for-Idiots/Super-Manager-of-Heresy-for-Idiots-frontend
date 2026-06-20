import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest';
import {
  calculateModifier,
  cn,
  formatDate,
  formatModifier,
  formatTimeAgo,
  getRoleRedirectPath,
  maskInviteCode,
} from '@/lib/utils';

describe('calculateModifier', () => {
  it('returns 0 at the baseline score of 10', () => {
    expect(calculateModifier(10)).toBe(0);
    expect(calculateModifier(11)).toBe(0);
  });

  it('floors toward negative infinity for odd low scores', () => {
    // (7 - 10) / 2 = -1.5 -> floor -> -2
    expect(calculateModifier(7)).toBe(-2);
    expect(calculateModifier(8)).toBe(-1);
    expect(calculateModifier(1)).toBe(-5);
  });

  it('scales up for high scores', () => {
    expect(calculateModifier(16)).toBe(3);
    expect(calculateModifier(20)).toBe(5);
  });
});

describe('formatModifier', () => {
  it('prefixes non-negative modifiers with a plus, including zero', () => {
    expect(formatModifier(10)).toBe('+0');
    expect(formatModifier(16)).toBe('+3');
  });

  it('keeps the native minus sign for negative modifiers', () => {
    expect(formatModifier(8)).toBe('-1');
    expect(formatModifier(1)).toBe('-5');
  });
});

describe('getRoleRedirectPath', () => {
  it('routes players and game masters to campaigns', () => {
    expect(getRoleRedirectPath('PLAYER')).toBe('/campaigns');
    expect(getRoleRedirectPath('GAME_MASTER')).toBe('/campaigns');
  });

  it('routes admins to the admin area', () => {
    expect(getRoleRedirectPath('ADMIN')).toBe('/admin');
  });

  it('falls back to login for unknown roles', () => {
    expect(getRoleRedirectPath('GUEST')).toBe('/login');
    expect(getRoleRedirectPath('')).toBe('/login');
  });
});

describe('maskInviteCode', () => {
  it('returns short codes untouched (length <= 3)', () => {
    expect(maskInviteCode('')).toBe('');
    expect(maskInviteCode('AB')).toBe('AB');
    expect(maskInviteCode('ABC')).toBe('ABC');
  });

  it('keeps the first three chars and masks the rest', () => {
    expect(maskInviteCode('ABCD')).toBe('ABC•');
    expect(maskInviteCode('ABCDEF')).toBe('ABC•••');
  });

  it('masks exactly as many chars as were hidden', () => {
    const code = 'INVITE-2024';
    const masked = maskInviteCode(code);
    expect(masked.startsWith('INV')).toBe(true);
    expect(masked).toHaveLength(code.length);
    expect(masked.replace(/[^•]/g, '')).toHaveLength(code.length - 3);
  });
});

describe('cn (class merge)', () => {
  it('drops falsy values and joins the rest', () => {
    expect(cn('a', false && 'b', undefined, null, 'c')).toBe('a c');
  });

  it('lets later tailwind utilities win conflicting ones', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('supports conditional object syntax', () => {
    expect(cn('base', { active: true, hidden: false })).toBe('base active');
  });
});

describe('formatTimeAgo', () => {
  // Pin "now" so relative formatting is deterministic regardless of wall clock.
  const NOW = new Date('2026-06-20T12:00:00.000Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const ago = (ms: number) => new Date(NOW - ms).toISOString();
  const MIN = 60_000;
  const HOUR = 60 * MIN;
  const DAY = 24 * HOUR;
  const WEEK = 7 * DAY;

  it('reports minutes under an hour', () => {
    expect(formatTimeAgo(ago(0))).toBe('0m ago');
    expect(formatTimeAgo(ago(5 * MIN))).toBe('5m ago');
    expect(formatTimeAgo(ago(59 * MIN))).toBe('59m ago');
  });

  it('reports hours under a day', () => {
    expect(formatTimeAgo(ago(HOUR))).toBe('1h ago');
    expect(formatTimeAgo(ago(23 * HOUR))).toBe('23h ago');
  });

  it('reports days under a week', () => {
    expect(formatTimeAgo(ago(DAY))).toBe('1d ago');
    expect(formatTimeAgo(ago(6 * DAY))).toBe('6d ago');
  });

  it('reports weeks under a month', () => {
    expect(formatTimeAgo(ago(WEEK))).toBe('1w ago');
    expect(formatTimeAgo(ago(3 * WEEK))).toBe('3w ago');
  });

  it('falls back to an absolute date beyond four weeks', () => {
    const old = ago(5 * WEEK);
    expect(formatTimeAgo(old)).toBe(formatDate(old));
  });
});

describe('formatDate', () => {
  it('renders a human month-day-year string', () => {
    // TZ-robust: assert shape rather than an exact day that could shift by offset.
    expect(formatDate('2026-06-20T12:00:00.000Z')).toMatch(/^[A-Za-z]{3} \d{1,2}, \d{4}$/);
  });

  it('includes the correct year', () => {
    expect(formatDate('2026-06-20T12:00:00.000Z')).toContain('2026');
  });
});
