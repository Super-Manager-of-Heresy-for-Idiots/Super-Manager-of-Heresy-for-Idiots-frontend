import { create } from 'zustand';
import type { User } from '@/types';

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

function getStoredUser(): User | null {
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
  login: (user: User, token: string, remember: boolean) => {
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
  setUser: (user: User) => {
    const storage = localStorage.getItem('token') ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
    set({ user });
  },
}));
