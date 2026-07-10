import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { authApi } from '@/api/auth.api';
import { useAuthStore } from '@/store/authStore';
import { scheduleProactiveRefresh, cancelProactiveRefresh } from '@/lib/authSession';
import { ensureCsrfToken } from '@/lib/csrf';
import { wsService } from '@/lib/websocket';
import { getRoleRedirectPath } from '@/lib/utils';
import { useT } from '@/i18n/I18nContext';
import type { LoginRequest, RegisterRequest, ApiError, UserResponse } from '@/types';
import { AxiosError } from 'axios';

type AuthResponseLike = {
  data?: unknown;
  token?: unknown;
  accessToken?: unknown;
  jwt?: unknown;
  expiresIn?: unknown;
  user?: unknown;
};

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' ? value as Record<string, unknown> : {};
}

function parseAuthResponse(response: unknown): { token: string; expiresIn: number; user: UserResponse } | null {
  const body = response as AuthResponseLike;
  const payload = asRecord(body.data ?? body);
  const tokenValue = payload.token ?? payload.accessToken ?? payload.jwt;
  const token = typeof tokenValue === 'string' ? tokenValue : undefined;
  const user = (payload.user ?? body.user) as UserResponse | undefined;
  const expiresInValue = payload.expiresIn;
  const expiresIn = typeof expiresInValue === 'number' ? expiresInValue : 0;
  if (!token || !user) return null;
  return { token, expiresIn, user };
}

export function useLogin() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      authApi.login({ username: data.username, password: data.password }),
    onSuccess: async (response) => {
      // The login endpoint is an external boundary: tolerate both the `{ success, data }`
      // envelope and a flat body, plus common token field names. If the token is missing
      // we surface a clear error instead of redirecting into a session that 401/403s.
      const parsed = parseAuthResponse(response);

      if (!parsed) {
        const body = response as AuthResponseLike;
        const payload = asRecord(body.data ?? body);
        console.error('[auth] Login response missing token/user.', {
          bodyKeys: body ? Object.keys(body) : null,
          payloadKeys: payload ? Object.keys(payload) : null,
        });
        toast.error(t('hk.auth.loginFailed'));
        return;
      }

      // Drop any data cached under the previous identity (covers account switching,
      // which is now a re-login rather than an in-place token swap).
      queryClient.clear();
      login(parsed.user, parsed.token);
      scheduleProactiveRefresh(parsed.expiresIn);
      await ensureCsrfToken(true);
      toast.success(t('hk.auth.welcomeBack', { name: parsed.user.username }));
      navigate(getRoleRedirectPath(parsed.user.role));
    },
    onError: (error: AxiosError<ApiError>) => {
      const message = error.response?.data?.message || t('hk.auth.loginFailed');
      toast.error(message);
    },
  });
}

export function useSwitchAccount() {
  const navigate = useNavigate();
  const login = useAuthStore((s) => s.login);
  const queryClient = useQueryClient();
  const t = useT();

  return useMutation({
    mutationFn: (userId: string) => authApi.switchAccount({ userId }),
    onSuccess: async (response) => {
      const parsed = parseAuthResponse(response);
      if (!parsed) {
        toast.error(t('hk.auth.loginFailed'));
        return;
      }
      cancelProactiveRefresh();
      wsService.disconnect();
      queryClient.clear();
      login(parsed.user, parsed.token);
      scheduleProactiveRefresh(parsed.expiresIn);
      await ensureCsrfToken(true);
      toast.success(t('hk.auth.welcomeBack', { name: parsed.user.username }));
      navigate(getRoleRedirectPath(parsed.user.role));
    },
    onError: () => {
      toast.error(t('hk.auth.loginFailed'));
    },
  });
}

export function useRegister() {
  const navigate = useNavigate();
  const t = useT();

  return useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async () => {
      await ensureCsrfToken(true);
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
  const queryClient = useQueryClient();
  const t = useT();

  return async () => {
    // Stop the proactive timer first so it can't resurrect the session mid-logout.
    cancelProactiveRefresh();
    try {
      // Best-effort: ask the server to clear the cookies. Even if this fails (already
      // expired, offline), we still tear down client state below.
      await authApi.logout();
    } catch {
      /* ignore — client teardown happens regardless */
    }
    await ensureCsrfToken(true);
    wsService.disconnect();
    logout();
    queryClient.clear();
    navigate('/login');
    toast.success(t('hk.auth.loggedOut'));
  };
}
