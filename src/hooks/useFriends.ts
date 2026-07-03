import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { friendsApi } from '@/api/friends.api';
import { wsService, type WsEventHandler } from '@/lib/websocket';

export const friendsKeys = {
  friends: () => ['friends'] as const,
  requests: (direction: 'incoming' | 'outgoing') => ['friend-requests', direction] as const,
  blocked: () => ['friends-blocked'] as const,
  search: (query: string) => ['user-search', query] as const,
};

export function useFriendsQuery() {
  return useQuery({
    queryKey: friendsKeys.friends(),
    queryFn: async () => (await friendsApi.listFriends()).data ?? [],
  });
}

export function useFriendRequestsQuery(direction: 'incoming' | 'outgoing') {
  return useQuery({
    queryKey: friendsKeys.requests(direction),
    queryFn: async () =>
      (await friendsApi.listRequests(direction === 'incoming' ? 'INCOMING' : 'OUTGOING')).data ?? [],
  });
}

export function useBlockedQuery() {
  return useQuery({
    queryKey: friendsKeys.blocked(),
    queryFn: async () => (await friendsApi.listBlocked()).data ?? [],
  });
}

export function useUserSearchQuery(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: friendsKeys.search(trimmed),
    queryFn: async () => (await friendsApi.searchUsers(trimmed)).data ?? [],
    enabled: trimmed.length >= 3,
    staleTime: 30_000,
  });
}

/** Invalidates every friends-related cache — used after any mutation or realtime event. */
function useInvalidateFriends() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: friendsKeys.friends() });
    queryClient.invalidateQueries({ queryKey: ['friend-requests'] });
    queryClient.invalidateQueries({ queryKey: friendsKeys.blocked() });
    queryClient.invalidateQueries({ queryKey: ['user-search'] });
  };
}

export function useFriendMutations() {
  const invalidate = useInvalidateFriends();
  const onError = (error: unknown) => {
    const message = error instanceof Error ? error.message : 'Действие не выполнено';
    toast.error(message);
  };

  const sendRequest = useMutation({
    mutationFn: (userId: string) => friendsApi.sendRequest(userId),
    onSuccess: () => {
      toast.success('Заявка отправлена');
      invalidate();
    },
    onError,
  });
  const accept = useMutation({
    mutationFn: (relationshipId: string) => friendsApi.acceptRequest(relationshipId),
    onSuccess: () => {
      toast.success('Заявка принята');
      invalidate();
    },
    onError,
  });
  const decline = useMutation({
    mutationFn: (relationshipId: string) => friendsApi.declineRequest(relationshipId),
    onSuccess: invalidate,
    onError,
  });
  const cancel = useMutation({
    mutationFn: (relationshipId: string) => friendsApi.cancelRequest(relationshipId),
    onSuccess: invalidate,
    onError,
  });
  const removeFriend = useMutation({
    mutationFn: (userId: string) => friendsApi.removeFriend(userId),
    onSuccess: () => {
      toast.success('Удалён из друзей');
      invalidate();
    },
    onError,
  });
  const block = useMutation({
    mutationFn: (userId: string) => friendsApi.block(userId),
    onSuccess: () => {
      toast.success('Пользователь заблокирован');
      invalidate();
    },
    onError,
  });
  const unblock = useMutation({
    mutationFn: (userId: string) => friendsApi.unblock(userId),
    onSuccess: invalidate,
    onError,
  });

  return { sendRequest, accept, decline, cancel, removeFriend, block, unblock };
}

/**
 * Bridges the core `/user/queue/notifications` FRIEND_* events to the friends caches: invalidate the
 * relevant queries and surface a toast. Delivery relies on the shared core wsService being connected.
 */
export function useFriendRealtime() {
  const invalidate = useInvalidateFriends();
  useEffect(() => {
    const handler: WsEventHandler = (event) => {
      if (event.type === 'FRIEND_REQUEST_RECEIVED') {
        invalidate();
        toast('Новая заявка в друзья', { icon: '👋' });
      } else if (event.type === 'FRIEND_REQUEST_ACCEPTED') {
        invalidate();
        toast.success('Ваша заявка принята');
      } else if (event.type === 'FRIEND_REMOVED') {
        invalidate();
      }
    };
    wsService.onEvent(handler);
    return () => wsService.offEvent(handler);
    // invalidate is stable enough for this effect; re-run only on mount/unmount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
