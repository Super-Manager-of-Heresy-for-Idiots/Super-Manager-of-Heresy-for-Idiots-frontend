/**
 * Wire contract for the ephemeral messenger service. These mirror the backend DTOs exactly and are
 * the single source of truth for the isolated messenger feature (kept out of the global src/types).
 */
export type UUID = string;

export type ChatSessionStatus = 'ACTIVE' | 'CLOSED';

export interface ChatPeer {
  userId: UUID;
  usernameSnapshot: string;
}

export interface ChatSessionSummary {
  id: UUID;
  status: ChatSessionStatus;
  peer: ChatPeer | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  unreadCount: number;
  expiresAt: string | null;
}

export interface ChatParticipant {
  userId: UUID;
  usernameSnapshot: string;
  lastReadSeq: number;
  lastReadAt: string | null;
}

export interface ChatSessionSnapshot {
  id: UUID;
  status: ChatSessionStatus;
  peer: ChatPeer | null;
  participants: ChatParticipant[];
  revision: number;
  messageCount: number;
  createdAt: string;
  lastMessageAt: string | null;
  closedAt: string | null;
  closeReason: string | null;
  expiresAt: string | null;
}

export interface ChatMessage {
  id: UUID;
  seq: number;
  senderId: UUID;
  body: string;
  createdAt: string;
}

// ── Realtime ────────────────────────────────────────────────────────────────
export type ChatEventType = 'SESSION_OPENED' | 'MESSAGE_CREATED' | 'PARTICIPANT_READ' | 'SESSION_CLOSED';

export interface ChatTopicEvent<T = unknown> {
  type: ChatEventType;
  sessionId: UUID;
  revision: number;
  payload: T;
}

export interface ChatUserNotification<T = unknown> {
  type: ChatEventType;
  sessionId: UUID;
  payload: T;
}

export interface ParticipantReadPayload {
  readerUserId: UUID;
  lastReadSeq: number;
}

export interface SessionClosedPayload {
  sessionId: UUID;
  closeReason: string | null;
  closedAt: string | null;
  expiresAt: string | null;
}

export interface TypingEvent {
  sessionId: UUID;
  userId: UUID;
  username: string;
  typing: boolean;
}

export interface ChatErrorMessage {
  code: string;
  message: string;
}
