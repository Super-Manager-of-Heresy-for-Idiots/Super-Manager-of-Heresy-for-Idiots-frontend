import type { ChatErrorMessage, ChatTopicEvent, ChatUserNotification, TypingEvent } from '../types';

export interface MessengerRouterHandlers {
  onSessionEvent: (event: ChatTopicEvent) => void;
  onTyping: (event: TypingEvent) => void;
  onNotification: (notification: ChatUserNotification) => void;
  onError: (error: ChatErrorMessage) => void;
}

/**
 * Pure dispatcher from parsed STOMP frames to typed handlers. Store-free so the branching stays
 * unit-testable; the hook wires the handlers to the store and query cache.
 */
export class MessengerMessageRouter {
  constructor(private readonly handlers: MessengerRouterHandlers) {}

  handleEventsMessage(raw: unknown): void {
    if (isRecord(raw) && typeof raw.type === 'string') {
      this.handlers.onSessionEvent(raw as unknown as ChatTopicEvent);
    }
  }

  handleTypingMessage(raw: unknown): void {
    if (isRecord(raw) && typeof raw.sessionId === 'string') {
      this.handlers.onTyping(raw as unknown as TypingEvent);
    }
  }

  handleNotification(raw: unknown): void {
    if (isRecord(raw) && typeof raw.type === 'string') {
      this.handlers.onNotification(raw as unknown as ChatUserNotification);
    }
  }

  handleError(raw: unknown): void {
    if (isRecord(raw) && typeof raw.message === 'string') {
      this.handlers.onError(raw as unknown as ChatErrorMessage);
    }
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
