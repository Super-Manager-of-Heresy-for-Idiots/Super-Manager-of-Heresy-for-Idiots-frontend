import { useCallback, useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { messengerApi } from '../api';
import { useMessengerStore } from '../state/messengerStore';
import type { ChatMessage, UUID } from '../types';
import { sumUnread } from '../utils/unread';

const PAGE_SIZE = 50;

/**
 * Stable empty array shared by the message selector. Returning a fresh `[]` from a zustand selector
 * every render fails the Object.is snapshot check and triggers an infinite re-render (React #185).
 */
const EMPTY_MESSAGES: ChatMessage[] = [];

export const messengerKeys = {
  sessions: () => ['messenger', 'sessions'] as const,
  snapshot: (sessionId: UUID) => ['messenger', 'snapshot', sessionId] as const,
  messages: (sessionId: UUID) => ['messenger', 'messages', sessionId] as const,
};

export function useSessionsQuery() {
  return useQuery({
    queryKey: messengerKeys.sessions(),
    queryFn: () => messengerApi.sessions.list(),
    refetchInterval: 60_000,
  });
}

/** Total unread across sessions — feeds the header badge. */
export function useUnreadCount(): number {
  const { data } = useSessionsQuery();
  return sumUnread(data ?? []);
}

export function useSnapshotQuery(sessionId: UUID | null) {
  return useQuery({
    queryKey: sessionId ? messengerKeys.snapshot(sessionId) : ['messenger', 'snapshot', 'none'],
    queryFn: () => messengerApi.sessions.snapshot(sessionId as UUID),
    enabled: Boolean(sessionId),
  });
}

/**
 * Drives the message list for the active session: seeds the store from the latest REST page, exposes
 * upward pagination (`loadOlder` via beforeSeq), and returns the store-backed message array so realtime
 * appends and the seed share one source of truth.
 */
export function useSessionMessages(sessionId: UUID | null) {
  const setMessages = useMessengerStore((s) => s.setMessages);
  const prependOlder = useMessengerStore((s) => s.prependOlder);
  const messages = useMessengerStore((s) =>
    sessionId ? s.messagesBySession[sessionId] ?? EMPTY_MESSAGES : EMPTY_MESSAGES,
  );
  const [hasMore, setHasMore] = useState(true);
  const [isFetchingOlder, setIsFetchingOlder] = useState(false);

  const latest = useQuery({
    queryKey: sessionId ? messengerKeys.messages(sessionId) : ['messenger', 'messages', 'none'],
    queryFn: () => messengerApi.sessions.messages(sessionId as UUID, undefined, PAGE_SIZE),
    enabled: Boolean(sessionId),
  });

  useEffect(() => {
    if (sessionId && latest.data) {
      setMessages(sessionId, latest.data);
      setHasMore(latest.data.length >= PAGE_SIZE);
    }
  }, [sessionId, latest.data, setMessages]);

  const loadOlder = useCallback(async () => {
    if (!sessionId || isFetchingOlder || !hasMore || messages.length === 0) return;
    setIsFetchingOlder(true);
    try {
      const older = await messengerApi.sessions.messages(sessionId, messages[0].seq, PAGE_SIZE);
      prependOlder(sessionId, older);
      if (older.length < PAGE_SIZE) setHasMore(false);
    } finally {
      setIsFetchingOlder(false);
    }
  }, [sessionId, isFetchingOlder, hasMore, messages, prependOlder]);

  return {
    messages,
    isLoading: latest.isLoading,
    error: latest.error,
    hasMore,
    isFetchingOlder,
    loadOlder,
  };
}

export function useOpenSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (peerUserId: UUID) => messengerApi.sessions.open(peerUserId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() }),
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Не удалось открыть переписку';
      toast.error(message);
    },
  });
}

export function useSendMessage(sessionId: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => messengerApi.sessions.send(sessionId as UUID, body),
    onSuccess: () => {
      if (!sessionId) return;
      queryClient.invalidateQueries({ queryKey: messengerKeys.messages(sessionId) });
      queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() });
    },
    onError: (error: unknown) => {
      const message = error instanceof Error ? error.message : 'Сообщение не отправлено';
      toast.error(message);
    },
  });
}

export function useReadSession(sessionId: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (lastReadSeq: number) => messengerApi.sessions.read(sessionId as UUID, lastReadSeq),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() }),
  });
}

export function useCloseSession(sessionId: UUID | null) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => messengerApi.sessions.close(sessionId as UUID),
    onSuccess: () => {
      if (!sessionId) return;
      queryClient.invalidateQueries({ queryKey: messengerKeys.snapshot(sessionId) });
      queryClient.invalidateQueries({ queryKey: messengerKeys.sessions() });
    },
  });
}
