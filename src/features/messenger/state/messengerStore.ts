import { create } from 'zustand';
import type { ChatMessage, TypingEvent, UUID } from '../types';

interface TypingState {
  userId: UUID;
  username: string;
  at: number;
}

interface MessengerState {
  activeSessionId: UUID | null;
  messagesBySession: Record<UUID, ChatMessage[]>;
  revisionBySession: Record<UUID, number>;
  typingBySession: Record<UUID, TypingState | null>;

  setActiveSession: (sessionId: UUID | null) => void;
  setMessages: (sessionId: UUID, messages: ChatMessage[]) => void;
  prependOlder: (sessionId: UUID, older: ChatMessage[]) => void;
  applyMessageCreated: (sessionId: UUID, message: ChatMessage, revision: number) => void;
  setRevision: (sessionId: UUID, revision: number) => void;
  setTyping: (event: TypingEvent) => void;
  reset: () => void;
}

const bySeqAsc = (a: ChatMessage, b: ChatMessage) => a.seq - b.seq;

/** Merge, de-duplicate by seq, and keep ascending order (oldest → newest). */
function mergeMessages(existing: ChatMessage[], incoming: ChatMessage[]): ChatMessage[] {
  const bySeq = new Map<number, ChatMessage>();
  for (const message of existing) bySeq.set(message.seq, message);
  for (const message of incoming) bySeq.set(message.seq, message);
  return Array.from(bySeq.values()).sort(bySeqAsc);
}

export const useMessengerStore = create<MessengerState>((set) => ({
  activeSessionId: null,
  messagesBySession: {},
  revisionBySession: {},
  typingBySession: {},

  setActiveSession: (sessionId) => set({ activeSessionId: sessionId }),

  setMessages: (sessionId, messages) =>
    set((state) => ({
      messagesBySession: { ...state.messagesBySession, [sessionId]: [...messages].sort(bySeqAsc) },
    })),

  prependOlder: (sessionId, older) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: mergeMessages(state.messagesBySession[sessionId] ?? [], older),
      },
    })),

  applyMessageCreated: (sessionId, message, revision) =>
    set((state) => ({
      messagesBySession: {
        ...state.messagesBySession,
        [sessionId]: mergeMessages(state.messagesBySession[sessionId] ?? [], [message]),
      },
      revisionBySession: { ...state.revisionBySession, [sessionId]: revision },
    })),

  setRevision: (sessionId, revision) =>
    set((state) => ({ revisionBySession: { ...state.revisionBySession, [sessionId]: revision } })),

  setTyping: (event) =>
    set((state) => ({
      typingBySession: {
        ...state.typingBySession,
        [event.sessionId]: event.typing
          ? { userId: event.userId, username: event.username, at: Date.now() }
          : null,
      },
    })),

  reset: () =>
    set({ activeSessionId: null, messagesBySession: {}, revisionBySession: {}, typingBySession: {} }),
}));
