import api from './axios';
import type { ApiResponse, AuthResponse, LoginRequest, RegisterRequest, SwitchAccountRequest, UserResponse } from '@/types';

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

  switchAccount: async (data: SwitchAccountRequest): Promise<ApiResponse<AuthResponse>> => {
    const response = await api.post<ApiResponse<AuthResponse>>('/auth/switch', data);
    return response.data;
  },

  forgetTrustedAccount: async (userId: string): Promise<ApiResponse<null>> => {
    const response = await api.delete<ApiResponse<null>>(`/auth/trusted-accounts/${userId}`);
    return response.data;
  },
};
