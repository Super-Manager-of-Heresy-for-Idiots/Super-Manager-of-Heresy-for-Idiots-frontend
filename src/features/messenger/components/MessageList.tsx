import { cn } from '@/lib/utils';
import type { ChatMessage, UUID } from '../types';
import { formatMessageTime } from '../utils/format';
import s from './messenger.module.css';

/**
 * Newest-at-bottom message list with upward pagination. Bodies are rendered as plain text (React
 * escapes by default; `dangerouslySetInnerHTML` is never used — TZ 4.9).
 */
export function MessageList({
  messages,
  currentUserId,
  hasMore,
  isFetchingOlder,
  onLoadOlder,
}: {
  messages: ChatMessage[];
  currentUserId: UUID | undefined;
  hasMore: boolean;
  isFetchingOlder: boolean;
  onLoadOlder: () => void;
}) {
  return (
    <div className={s.msgList}>
      {hasMore && (
        <button
          type="button"
          className={cn('ao-btn', s.loadOlder)}
          onClick={onLoadOlder}
          disabled={isFetchingOlder}
        >
          {isFetchingOlder ? 'Загрузка…' : 'Показать более ранние'}
        </button>
      )}
      {messages.map((message) => {
        const own = message.senderId === currentUserId;
        return (
          <div key={message.id} className={cn(s.msgRow, own && s.msgOwn)}>
            <div className={s.msgBubble}>{message.body}</div>
            <div className={s.msgMeta}>{formatMessageTime(message.createdAt)}</div>
          </div>
        );
      })}
    </div>
  );
}
