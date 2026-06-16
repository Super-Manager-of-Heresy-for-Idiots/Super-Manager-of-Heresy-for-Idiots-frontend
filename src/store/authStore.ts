import { create } from 'zustand';
import type { UserResponse } from '@/types';

/** A locally remembered login the user can switch back into without re-entering credentials. */
export interface SavedAccount {
  user: UserResponse;
  token: string;
  remember: boolean;
}

interface AuthState {
  user: UserResponse | null;
  token: string | null;
  isAuthenticated: boolean;
  savedAccounts: SavedAccount[];
  login: (user: UserResponse, token: string, remember: boolean) => void;
  logout: () => void;
  setUser: (user: UserResponse) => void;
  switchAccount: (userId: string) => void;
  removeAccount: (userId: string) => void;
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

function getStoredAccounts(): SavedAccount[] {
  const raw = localStorage.getItem('savedAccounts');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistAccounts(accounts: SavedAccount[]) {
  localStorage.setItem('savedAccounts', JSON.stringify(accounts));
}

/** Upsert an account into the saved list, keyed by user id. */
function upsertAccount(accounts: SavedAccount[], entry: SavedAccount): SavedAccount[] {
  const next = accounts.filter((a) => a.user.id !== entry.user.id);
  next.push(entry);
  return next;
}

/** Write the active session token/user to the storage that matches its `remember` flag. */
function writeActiveSession(user: UserResponse, token: string, remember: boolean) {
  const storage = remember ? localStorage : sessionStorage;
  const other = remember ? sessionStorage : localStorage;
  other.removeItem('token');
  other.removeItem('user');
  storage.setItem('token', token);
  storage.setItem('user', JSON.stringify(user));
}

function clearActiveSession() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('user');
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  savedAccounts: getStoredAccounts(),
  login: (user: UserResponse, token: string, remember: boolean) => {
    if (!token) {
      // Guard against persisting an empty/undefined token, which would leave the app
      // looking "logged in" while every request fails with 401/403.
      throw new Error('Authentication token missing from login response');
    }
    writeActiveSession(user, token, remember);
    const savedAccounts = upsertAccount(get().savedAccounts, { user, token, remember });
    persistAccounts(savedAccounts);
    set({ user, token, isAuthenticated: true, savedAccounts });
  },
  logout: () => {
    clearActiveSession();
    set({ user: null, token: null, isAuthenticated: false });
  },
  setUser: (user: UserResponse) => {
    const remember = !!localStorage.getItem('token');
    const storage = remember ? localStorage : sessionStorage;
    storage.setItem('user', JSON.stringify(user));
    const savedAccounts = upsertAccount(get().savedAccounts, {
      user,
      token: get().token ?? '',
      remember,
    });
    persistAccounts(savedAccounts);
    set({ user, savedAccounts });
  },
  switchAccount: (userId: string) => {
    const entry = get().savedAccounts.find((a) => a.user.id === userId);
    if (!entry) return;
    writeActiveSession(entry.user, entry.token, entry.remember);
    set({ user: entry.user, token: entry.token, isAuthenticated: true });
  },
  removeAccount: (userId: string) => {
    const savedAccounts = get().savedAccounts.filter((a) => a.user.id !== userId);
    persistAccounts(savedAccounts);
    if (get().user?.id === userId) {
      clearActiveSession();
      set({ user: null, token: null, isAuthenticated: false, savedAccounts });
    } else {
      set({ savedAccounts });
    }
  },
}));
