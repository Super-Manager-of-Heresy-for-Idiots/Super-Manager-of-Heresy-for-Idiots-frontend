import { create } from 'zustand';
import type { User } from '@/types';
import { normalizeRole } from '@/lib/ao-utils';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string, remember: boolean) => void;
  logout: () => void;
  setUser: (user: User) => void;
}

function getStoredToken(): string | null {
  return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getRoleFromToken(token: string | null): User['role'] | null {
  if (!token) {
    return null;
  }

  try {
    const payload = token.split('.')[1];
    if (!payload) {
      return null;
    }

    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const parsed = JSON.parse(atob(padded)) as { role?: string };

    return normalizeRole(parsed.role);
  } catch {
    return null;
  }
}

function normalizeUser(user: User, token: string | null): User | null {
  const role = getRoleFromToken(token) || normalizeRole(user.role);

  if (!role) {
    console.warn('[auth] Unknown user role received from API', { role: user.role });
    return null;
  }

  return { ...user, role };
}

function getStoredUser(): User | null {
  const localUserJson = localStorage.getItem('user');
  const userJson = localUserJson || sessionStorage.getItem('user');
  const token = localUserJson ? localStorage.getItem('token') : sessionStorage.getItem('token');

  if (userJson) {
    try {
      return normalizeUser(JSON.parse(userJson), token);
    } catch {
      return null;
    }
  }
  return null;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  login: (user: User, token: string, remember: boolean) => {
    const normalizedUser = normalizeUser(user, token);
    if (!normalizedUser) {
      return;
    }

    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(normalizedUser));
    set({ user: normalizedUser, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user: User) => {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    const normalizedUser = normalizeUser(user, getStoredToken());
    if (!normalizedUser) {
      return;
    }

    storage.setItem('user', JSON.stringify(normalizedUser));
    set({ user: normalizedUser });
  },
}));
