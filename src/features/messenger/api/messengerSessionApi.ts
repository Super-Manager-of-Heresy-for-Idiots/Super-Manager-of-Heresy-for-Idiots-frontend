import messengerHttp from './messengerHttp';
import type { ChatMessage, ChatSessionSnapshot, ChatSessionSummary, UUID } from '../types';

/**
 * REST client for `/api/chat-sessions`. The messenger returns raw DTOs (no `{success,data}` envelope),
 * so `response.data` IS the payload.
 */
export const messengerSessionApi = {
  open: async (peerUserId: UUID): Promise<ChatSessionSnapshot> => {
    const response = await messengerHttp.post<ChatSessionSnapshot>('/chat-sessions', { peerUserId });
    return response.data;
  },

  list: async (): Promise<ChatSessionSummary[]> => {
    const response = await messengerHttp.get<ChatSessionSummary[]>('/chat-sessions');
    return response.data;
  },

  snapshot: async (sessionId: UUID): Promise<ChatSessionSnapshot> => {
    const response = await messengerHttp.get<ChatSessionSnapshot>(`/chat-sessions/${sessionId}`);
    return response.data;
  },

  messages: async (sessionId: UUID, beforeSeq?: number, limit = 50): Promise<ChatMessage[]> => {
    const response = await messengerHttp.get<ChatMessage[]>(`/chat-sessions/${sessionId}/messages`, {
      params: { beforeSeq, limit },
    });
    return response.data;
  },

  send: async (sessionId: UUID, body: string): Promise<ChatMessage> => {
    const response = await messengerHttp.post<ChatMessage>(`/chat-sessions/${sessionId}/messages`, { body });
    return response.data;
  },

  read: async (sessionId: UUID, lastReadSeq: number): Promise<void> => {
    await messengerHttp.post(`/chat-sessions/${sessionId}/read`, { lastReadSeq });
  },

  close: async (sessionId: UUID): Promise<ChatSessionSnapshot> => {
    const response = await messengerHttp.post<ChatSessionSnapshot>(`/chat-sessions/${sessionId}/close`);
    return response.data;
  },
};
