import type { UUID } from '../types';

/** STOMP destinations for the messenger, in one place so client and tests agree. */
export const messengerWsDestinations = {
  topicEvents: (sessionId: UUID) => `/topic/chat-sessions/${sessionId}/events`,
  topicTyping: (sessionId: UUID) => `/topic/chat-sessions/${sessionId}/typing`,
  appTyping: (sessionId: UUID) => `/app/chat-sessions/${sessionId}/typing`,
  userNotifications: '/user/queue/chat-notifications',
  userErrors: '/user/queue/chat-errors',
} as const;
