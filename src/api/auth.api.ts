import api from './axios';
import type { ApiResponse, LoginResponse, LoginDto, RegisterDto } from '@/types';

export const authApi = {
  login: async (data: LoginDto): Promise<ApiResponse<LoginResponse>> => {
    const response = await api.post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
  },

  register: async (data: RegisterDto): Promise<ApiResponse<null>> => {
    const response = await api.post<ApiResponse<null>>('/auth/register', data);
    return response.data;
  },
};
