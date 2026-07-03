import { beforeEach, describe, expect, it } from 'vitest';
import { useMessengerStore } from './messengerStore';
import type { ChatMessage } from '../types';

const msg = (seq: number): ChatMessage => ({
  id: `m${seq}`,
  seq,
  senderId: 'u1',
  body: `body ${seq}`,
  createdAt: '2026-07-03T10:00:00Z',
});

describe('messengerStore', () => {
  beforeEach(() => useMessengerStore.getState().reset());

  it('sorts messages ascending by seq', () => {
    useMessengerStore.getState().setMessages('s1', [msg(3), msg(1), msg(2)]);
    expect(useMessengerStore.getState().messagesBySession['s1'].map((m) => m.seq)).toEqual([1, 2, 3]);
  });

  it('applyMessageCreated dedupes by seq and tracks revision', () => {
    const store = useMessengerStore.getState();
    store.setMessages('s1', [msg(1), msg(2)]);
    store.applyMessageCreated('s1', msg(2), 5); // duplicate seq
    store.applyMessageCreated('s1', msg(3), 6);
    const state = useMessengerStore.getState();
    expect(state.messagesBySession['s1'].map((m) => m.seq)).toEqual([1, 2, 3]);
    expect(state.revisionBySession['s1']).toBe(6);
  });

  it('prependOlder merges older pages without duplicating', () => {
    const store = useMessengerStore.getState();
    store.setMessages('s1', [msg(3), msg(4)]);
    store.prependOlder('s1', [msg(1), msg(2), msg(3)]);
    expect(useMessengerStore.getState().messagesBySession['s1'].map((m) => m.seq)).toEqual([1, 2, 3, 4]);
  });

  it('setTyping stores then clears the peer typing state', () => {
    const store = useMessengerStore.getState();
    store.setTyping({ sessionId: 's1', userId: 'u2', username: 'Bob', typing: true });
    expect(useMessengerStore.getState().typingBySession['s1']?.username).toBe('Bob');
    store.setTyping({ sessionId: 's1', userId: 'u2', username: 'Bob', typing: false });
    expect(useMessengerStore.getState().typingBySession['s1']).toBeNull();
  });
});
