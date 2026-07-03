import { useCallback, useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';
import { messengerKeys } from '../hooks/useMessengerQueries';
import { useMessengerStore } from '../state/messengerStore';
import type { ChatMessage, UUID } from '../types';
import { MessengerMessageRouter } from './messengerMessageRouter';
import { MessengerStompClient, type MessengerConnectionState } from './messengerStompClient';

/**
 * Opens (and owns) a native-STOMP connection for the active session. Commit events append to the store
 * / invalidate caches, typing updates the transient store, and personal notifications refresh the
 * session list (unread badge). Returns the live connection state and a `sendTyping` publisher.
 */
export function useMessengerRealtime(sessionId: UUID | null) {
  const queryClient = useQueryClient();
  const applyMessageCreated = useMessengerStore((s) => s.applyMessageCreated);
  const setRevision = useMessengerStore((s) => s.setRevision);
  const setTyping = useMessengerStore((s) => s.setTyping);
  const currentUserId = useAuthStore((s) => s.user?.id);
  const [connectionState, setConnectionState] = useState<MessengerConnectionState>('offline');
  const clientRef = useRef<MessengerStompClient | null>(null);

  useEffect(() => {
    if (!sessionId) return undefined;

    const router = new MessengerMessageRouter({
      onSessionEvent: (event) => {
        if (event.type === 'MESSAGE_CREATED') {
          applyMessageCreated(sessionId, event.payload as ChatMessage, event.revision);
          queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() });
        } else if (event.type === 'PARTICIPANT_READ' || event.type === 'SESSION_CLOSED') {
          setRevision(sessionId, event.revision);
          queryClient.invalidateQueries({ queryKey: messengerKeys.snapshot(sessionId) });
          queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() });
        }
      },
      onTyping: (event) => {
        if (event.userId !== currentUserId) setTyping(event);
      },
      onNotification: () => {
        queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() });
      },
      onError: (error) => toast.error(error.message),
    });

    const client = new MessengerStompClient({
      sessionId,
      router,
      onConnectionStateChange: setConnectionState,
    });
    clientRef.current = client;
    client.activate();

    return () => {
      client.deactivate();
      clientRef.current = null;
    };
  }, [sessionId, queryClient, applyMessageCreated, setRevision, setTyping, currentUserId]);

  const sendTyping = useCallback((typing: boolean) => {
    clientRef.current?.sendTyping(typing);
  }, []);

  return { connectionState, sendTyping };
}
