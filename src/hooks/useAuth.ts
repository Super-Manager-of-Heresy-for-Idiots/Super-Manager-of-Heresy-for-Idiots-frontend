import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import type { LoginDto, RegisterDto, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);

  return useMutation({
    mutationFn: (data: LoginDto & { remember: boolean }) =>
      authApi.login({ username: data.username, password: data.password }),
    onSuccess: (response, variables) => {
      const { token, user } = response.data;
      login(user, token, variables.remember);
      toast.success('Welcome back, ' + user.username + '!');
      navigate(getRoleRedirectPath(user.role));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Login failed';
      toast.error(message);
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (data: RegisterDto) => authApi.register(data),
    onSuccess: () => {
      toast.success('Registration successful! Please log in.');
      navigate('/login');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || 'Registration failed';
      if (!error.response?.data?.fields) {
        toast.error(message);
      }
      throw error;
    },
  });
}

export function useLogout() {
  const navigate = useNavigate();
  const logout = useAuthStore((s) => s.logout);

  return () => {
    logout();
    navigate('/login');
    toast.success('Logged out successfully');
  };
}
