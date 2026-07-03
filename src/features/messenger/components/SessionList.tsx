import { cn } from '@/lib/utils';
import type { ChatSessionSummary, UUID } from '../types';
import { formatExpiry } from '../utils/format';
import s from './messenger.module.css';

/** Master column: sessions sorted by recency, with unread badge and a CLOSED marker. */
export function SessionList({
  sessions,
  activeId,
  onSelect,
}: {
  sessions: ChatSessionSummary[];
  activeId: UUID | null;
  onSelect: (sessionId: UUID) => void;
}) {
  if (sessions.length === 0) {
    return <div className={s.status}>Пока нет переписок. Откройте сессию из списка друзей.</div>;
  }
  return (
    <div className={s.sessionList}>
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          className={cn(s.sessionItem, session.id === activeId && s.sessionItemActive)}
          onClick={() => onSelect(session.id)}
        >
          <div className={s.sessionTop}>
            <span className={s.sessionName}>{session.peer?.usernameSnapshot ?? 'Диалог'}</span>
            {session.unreadCount > 0 && <span className={s.unread}>{session.unreadCount}</span>}
          </div>
          <span className={s.preview}>{session.lastMessagePreview ?? 'Нет сообщений'}</span>
          {session.status === 'CLOSED' && (
            <span className={s.closedTag}>
              закрыта{session.expiresAt ? ` · до ${formatExpiry(session.expiresAt)}` : ''}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
