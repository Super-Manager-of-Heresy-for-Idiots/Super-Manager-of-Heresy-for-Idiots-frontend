import api from './axios';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, UserResponse } from '@/types';

export const authApi = {
  login: async (data: LoginRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterRequest): Promise<ApiResponse<UserResponse>> => {
    const response = await api.post<ApiResponse<UserResponse>>('/auth/register', data);
    return response.data;
  },

  // No body — the browser sends the session cookies; the server clears them (Max-Age=0).
  logout: async (): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/logout');
    return response.data;
  },
};
