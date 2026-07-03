import type { ChatSessionSummary } from '../types';

/** Total unread across all sessions — the number shown on the header badge. */
export function sumUnread(sessions: ChatSessionSummary[]): number {
  return sessions.reduce((total, session) => total + Math.max(0, session.unreadCount ?? 0), 0);
}
