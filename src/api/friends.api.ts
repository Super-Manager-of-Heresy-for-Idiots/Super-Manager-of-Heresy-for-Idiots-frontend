import api from './axios';
import type {
  ApiResponse,
  BlockedUserResponse,
  FriendRequestDirection,
  FriendRequestResponse,
  FriendResponse,
  UserSearchResultResponse,
} from '@/types';

/**
 * Social graph client (core backend). Endpoints mirror FriendController:
 *   GET  /api/users/search?username=&limit=
 *   POST /api/friends/requests { userId }
 *   GET  /api/friends/requests?direction=incoming|outgoing
 *   POST /api/friends/requests/{id}/accept | /decline
 *   DELETE /api/friends/requests/{id}
 *   GET  /api/friends ; DELETE /api/friends/{userId}
 *   POST/DELETE /api/friends/{userId}/block ; GET /api/friends/blocked
 */
export const friendsApi = {
  searchUsers: async (username: string, limit = 10): Promise<ApiResponse<UserSearchResultResponse[]>> => {
    const response = await api.get<ApiResponse<UserSearchResultResponse[]>>('/users/search', {
      params: { username, limit },
    });
    return response.data;
  },

  sendRequest: async (userId: string): Promise<ApiResponse<FriendRequestResponse>> => {
    const response = await api.post<ApiResponse<FriendRequestResponse>>('/friends/requests', { userId });
    return response.data;
  },

  listRequests: async (direction: FriendRequestDirection): Promise<ApiResponse<FriendRequestResponse[]>> => {
    const response = await api.get<ApiResponse<FriendRequestResponse[]>>('/friends/requests', {
      params: { direction: direction.toLowerCase() },
    });
    return response.data;
  },

  acceptRequest: async (relationshipId: string): Promise<ApiResponse<FriendResponse>> => {
    const response = await api.post<ApiResponse<FriendResponse>>(`/friends/requests/${relationshipId}/accept`);
    return response.data;
  },

  declineRequest: async (relationshipId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/friends/requests/${relationshipId}/decline`);
    return response.data;
  },

  cancelRequest: async (relationshipId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/friends/requests/${relationshipId}`);
    return response.data;
  },

  listFriends: async (): Promise<ApiResponse<FriendResponse[]>> => {
    const response = await api.get<ApiResponse<FriendResponse[]>>('/friends');
    return response.data;
  },

  removeFriend: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/friends/${userId}`);
    return response.data;
  },

  block: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.post<ApiResponse<void>>(`/friends/${userId}/block`);
    return response.data;
  },

  unblock: async (userId: string): Promise<ApiResponse<void>> => {
    const response = await api.delete<ApiResponse<void>>(`/friends/${userId}/block`);
    return response.data;
  },

  listBlocked: async (): Promise<ApiResponse<BlockedUserResponse[]>> => {
    const response = await api.get<ApiResponse<BlockedUserResponse[]>>('/friends/blocked');
    return response.data;
  },
};
