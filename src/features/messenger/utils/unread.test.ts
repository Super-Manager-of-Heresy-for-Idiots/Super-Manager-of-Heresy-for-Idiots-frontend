import { describe, expect, it } from 'vitest';
import { sumUnread } from './unread';
import type { ChatSessionSummary } from '../types';

const session = (unreadCount: number): ChatSessionSummary => ({
  id: 'x',
  status: 'ACTIVE',
  peer: null,
  lastMessageAt: null,
  lastMessagePreview: null,
  unreadCount,
  expiresAt: null,
});

describe('sumUnread', () => {
  it('sums unread across sessions', () => {
    expect(sumUnread([session(2), session(0), session(5)])).toBe(7);
  });

  it('is 0 for no sessions and never negative', () => {
    expect(sumUnread([])).toBe(0);
    expect(sumUnread([session(-3)])).toBe(0);
  });
});
