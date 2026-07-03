import { describe, expect, it, vi } from 'vitest';
import { messengerWsDestinations } from './messengerWsDestinations';
import { resolveMessengerWsUrl } from './messengerWsConfig';
import { MessengerMessageRouter } from './messengerMessageRouter';

describe('messenger STOMP destinations', () => {
  it('builds the session topic and app destinations', () => {
    expect(messengerWsDestinations.topicEvents('s1')).toBe('/topic/chat-sessions/s1/events');
    expect(messengerWsDestinations.topicTyping('s1')).toBe('/topic/chat-sessions/s1/typing');
    expect(messengerWsDestinations.appTyping('s1')).toBe('/app/chat-sessions/s1/typing');
    expect(messengerWsDestinations.userNotifications).toBe('/user/queue/chat-notifications');
    expect(messengerWsDestinations.userErrors).toBe('/user/queue/chat-errors');
  });

  it('resolves a native /ws/messenger url (node fallback)', () => {
    expect(resolveMessengerWsUrl()).toMatch(/\/ws\/messenger$/);
  });
});

describe('MessengerMessageRouter dispatch', () => {
  it('routes each frame to the matching handler and drops malformed ones', () => {
    const handlers = {
      onSessionEvent: vi.fn(),
      onTyping: vi.fn(),
      onNotification: vi.fn(),
      onError: vi.fn(),
    };
    const router = new MessengerMessageRouter(handlers);

    router.handleEventsMessage({ type: 'MESSAGE_CREATED', sessionId: 's1', revision: 3, payload: {} });
    router.handleTypingMessage({ sessionId: 's1', userId: 'u1', username: 'u', typing: true });
    router.handleNotification({ type: 'SESSION_OPENED', sessionId: 's2', payload: {} });
    router.handleError({ code: 'RATE_LIMITED', message: 'slow down' });
    router.handleEventsMessage('not-an-object');

    expect(handlers.onSessionEvent).toHaveBeenCalledTimes(1);
    expect(handlers.onTyping).toHaveBeenCalledTimes(1);
    expect(handlers.onNotification).toHaveBeenCalledTimes(1);
    expect(handlers.onError).toHaveBeenCalledTimes(1);
  });
});
