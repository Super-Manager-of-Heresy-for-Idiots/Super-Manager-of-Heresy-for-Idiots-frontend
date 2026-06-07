import { useMutation } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { getRoleRedirectPath } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import type { LoginRequest, RegisterRequest, ApiError } from '@/types';
import { AxiosError } from 'axios';

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const t = useT();

  return useMutation({
    mutationFn: (data: LoginRequest & { remember: boolean }) =>
      authApi.login({ username: data.username, password: data.password }),
    onSuccess: (response, variables) => {
      const { token, user } = response.data!;
      login(user, token, variables.remember);
      toast.success(t('hk.auth.welcomeBack', { name: user.username }));
      navigate(getRoleRedirectPath(user.role));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.auth.loginFailed');
      toast.error(message);
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const t = useT();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: () => {
      toast.success(t('hk.auth.registerSuccess'));
      navigate('/login');
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.auth.registerFailed');
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
  const t = useT();

  return () => {
    logout();
    navigate('/login');
    toast.success(t('hk.auth.loggedOut'));
  };
}
