import type { Role } from '@/types';

export function cx(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}

export function calcModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function formatModifier(mod: number): string {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function normalizeRole(role: string | null | undefined): Role | null {
  if (!role) {
    return null;
  }

  const value = role.trim();
  const canonical = value.toUpperCase().replace(/^ROLE_/, '');

  if (canonical === 'PLAYER' || canonical === 'GAME_MASTER' || canonical === 'ADMIN') {
    return canonical;
  }

  switch (value) {
    case '\u0418\u0433\u0440\u043e\u043a':
      return 'PLAYER';
    case '\u041c\u0430\u0441\u0442\u0435\u0440 \u0438\u0433\u0440\u044b':
      return 'GAME_MASTER';
    case '\u0410\u0434\u043c\u0438\u043d\u0438\u0441\u0442\u0440\u0430\u0442\u043e\u0440':
      return 'ADMIN';
    default:
      return null;
  }
}

export function getRoleRedirect(role: string): string {
  switch (normalizeRole(role)) {
    case 'ADMIN': return '/admin';
    case 'GAME_MASTER': return '/gm/teams';
    case 'PLAYER': return '/characters';
    default: return '/login';
  }
}
