import { useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/store/authStore';
import { EphemeralBanner } from '../components/EphemeralBanner';
import { MessageInput } from '../components/MessageInput';
import { MessageList } from '../components/MessageList';
import { SessionList } from '../components/SessionList';
import { TypingIndicator } from '../components/TypingIndicator';
import {
  useCloseSession,
  useReadSession,
  useSendMessage,
  useSessionMessages,
  useSessionsQuery,
  useSnapshotQuery,
} from '../hooks/useMessengerQueries';
import { useMessengerRealtime } from '../realtime/useMessengerRealtime';
import s from '../components/messenger.module.css';

/** Master-detail messenger view. Serves both `/messages` and `/messages/:sessionId`. */
export default function MessengerPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const activeId = sessionId ?? null;
  const currentUserId = useAuthStore((state) => state.user?.id);

  const sessionsQuery = useSessionsQuery();
  const snapshotQuery = useSnapshotQuery(activeId);
  const { messages, isLoading: messagesLoading, hasMore, isFetchingOlder, loadOlder } =
    useSessionMessages(activeId);
  const { sendTyping } = useMessengerRealtime(activeId);
  const sendMutation = useSendMessage(activeId);
  const readMutation = useReadSession(activeId);
  const closeMutation = useCloseSession(activeId);

  const snapshot = snapshotQuery.data;
  const status = snapshot?.status ?? 'ACTIVE';
  const markRead = readMutation.mutate;

  // Mark the session read as new messages land (guarded so we don't re-POST the same seq).
  const lastReadSentRef = useRef<number>(0);
  useEffect(() => {
    lastReadSentRef.current = 0;
  }, [activeId]);
  useEffect(() => {
    if (!activeId || status !== 'ACTIVE' || messages.length === 0) return;
    const maxSeq = messages[messages.length - 1].seq;
    if (maxSeq > lastReadSentRef.current) {
      lastReadSentRef.current = maxSeq;
      markRead(maxSeq);
    }
  }, [activeId, status, messages, markRead]);

  const sessions = sessionsQuery.data ?? [];

  return (
    <div className={s.layout}>
      <div className={cn(s.master, activeId && s.masterHiddenOnMobile)}>
        {sessionsQuery.isLoading ? (
          <div className={s.status}>
            <Loader2 className="animate-spin" size={18} />
          </div>
        ) : sessionsQuery.error ? (
          <div className={s.status}>Не удалось загрузить переписки.</div>
        ) : (
          <SessionList
            sessions={sessions}
            activeId={activeId}
            onSelect={(id) => navigate(`/messages/${id}`)}
          />
        )}
      </div>

      <div className={s.detail}>
        {!activeId ? (
          <div className={s.empty}>
            <div>Выберите переписку слева или откройте новую из списка друзей.</div>
          </div>
        ) : (
          <>
            <div className={s.chatHeader}>
              <span className={s.chatPeer}>{snapshot?.peer?.usernameSnapshot ?? 'Диалог'}</span>
              {status === 'ACTIVE' && (
                <button
                  type="button"
                  className="ao-btn ao-btn--ghost ao-btn--sm"
                  onClick={() => closeMutation.mutate()}
                  disabled={closeMutation.isPending}
                >
                  Закрыть сессию
                </button>
              )}
            </div>

            <EphemeralBanner status={status} expiresAt={snapshot?.expiresAt ?? null} />

            {messagesLoading ? (
              <div className={s.status}>
                <Loader2 className="animate-spin" size={18} />
              </div>
            ) : (
              <MessageList
                messages={messages}
                currentUserId={currentUserId}
                hasMore={hasMore}
                isFetchingOlder={isFetchingOlder}
                onLoadOlder={loadOlder}
              />
            )}

            <TypingIndicator sessionId={activeId} />

            <MessageInput
              disabled={status === 'CLOSED' || sendMutation.isPending}
              onSend={(body) => sendMutation.mutate(body)}
              onTyping={sendTyping}
            />
          </>
        )}
      </div>
    </div>
  );
}
