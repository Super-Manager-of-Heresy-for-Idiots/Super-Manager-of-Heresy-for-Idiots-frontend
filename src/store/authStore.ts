import { create } from 'zustand';
import type { UserResponse } from '@/types';

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: UserResponse, token: string, remember: boolean) => void;
  logout: () => void;
  setUser: (user: UserResponse) => void;
}

function getStoredToken(): string | null {
  const raw = localStorage.getItem('token') || sessionStorage.getItem('token');
  // Self-heal: older sessions may have persisted the literal string "undefined"/"null"
  // (when the login response lacked a token), which would be sent as `Bearer undefined`.
  if (!raw || raw === 'undefined' || raw === 'null') {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    return null;
  }
  return raw;
}

function getStoredUser(): UserResponse | null {
  const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
  if (userJson) {
    try {
      return JSON.parse(userJson);
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
  login: (user: UserResponse, token: string, remember: boolean) => {
    if (!token) {
      // Guard against persisting an empty/undefined token, which would leave the app
      // looking "logged in" while every request fails with 401/403.
      throw new Error('Authentication token missing from login response');
    }
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('token', token);
    storage.setItem('user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user: UserResponse) => {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
