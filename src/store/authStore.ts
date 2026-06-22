import { create } from 'zustand';
import type { UserResponse } from '@/types';

/**
 * A locally remembered login shown in the quick-switch list. Metadata only —
 * no token is stored. The session lives in HttpOnly cookies the JS can't read,
 * so "switching" is a re-login (see AccountSwitcher), not a token swap.
 */
export interface SavedAccount {
  user: UserResponse;
}

interface AuthState {
  user: UserResponse | null;
  /** Access token, kept in memory only. Needed for the WebSocket STOMP handshake;
   *  REST is authorized by the HttpOnly cookie. Never persisted. */
  token: string | null;
  isAuthenticated: boolean;
  /** False until the app-start session restore (POST /auth/refresh) settles. The
   *  router stays behind a splash until this is true so logged-in users don't flash
   *  the login screen on reload. */
  authReady: boolean;
  savedAccounts: SavedAccount[];
  login: (user: UserResponse, token: string) => void;
  logout: () => void;
  setAuthReady: (ready: boolean) => void;
  removeAccount: (userId: string) => void;
}

function getStoredAccounts(): SavedAccount[] {
  const raw = localStorage.getItem('savedAccounts');
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Tolerate the legacy shape ({ user, token, remember }) by keeping only `user`
    // so the saved-logins list survives the cookie migration without leaking tokens.
    return parsed
      .filter((a): a is { user: UserResponse } => !!a && typeof a === 'object' && !!a.user)
      .map((a) => ({ user: a.user }));
  } catch {
    return [];
  }
}

function persistAccounts(accounts: SavedAccount[]) {
  localStorage.setItem('savedAccounts', JSON.stringify(accounts));
}

/** Upsert an account into the saved list, keyed by user id. */
function upsertAccount(accounts: SavedAccount[], user: UserResponse): SavedAccount[] {
  const next = accounts.filter((a) => a.user.id !== user.id);
  next.push({ user });
  return next;
}

// One-time cleanup of the pre-cookie session: the access token (and user) used to be
// persisted to localStorage/sessionStorage. The token now lives in memory only (the
// session is in HttpOnly cookies), so purge any stale copies left by older builds —
// otherwise a JWT would linger in web storage, defeating the XSS hardening.
localStorage.removeItem('token');
localStorage.removeItem('user');
sessionStorage.removeItem('token');
sessionStorage.removeItem('user');

// Re-persist the accounts list stripped of any legacy per-account tokens, so the
// migration takes effect immediately on first load of the new build.
const initialAccounts = getStoredAccounts();
persistAccounts(initialAccounts);

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  authReady: false,
  savedAccounts: initialAccounts,
  login: (user: UserResponse, token: string) => {
    if (!token) {
      // Guard against an empty/undefined token, which would leave the app looking
      // "logged in" while the WS handshake fails.
      throw new Error('Authentication token missing from login response');
    }
    const savedAccounts = upsertAccount(get().savedAccounts, user);
    persistAccounts(savedAccounts);
    set({ user, token, isAuthenticated: true, savedAccounts });
  },
  logout: () => {
    set({ user: null, token: null, isAuthenticated: false });
  },
  setAuthReady: (ready: boolean) => set({ authReady: ready }),
  removeAccount: (userId: string) => {
    const savedAccounts = get().savedAccounts.filter((a) => a.user.id !== userId);
    persistAccounts(savedAccounts);
    set({ savedAccounts });
  },
}));
