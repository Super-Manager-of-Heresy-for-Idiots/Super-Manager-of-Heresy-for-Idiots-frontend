import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function calculateModifier(value: number): number {
  return Math.floor((value - 10) / 2);
}

export function formatModifier(value: number): string {
  const mod = calculateModifier(value);
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function getRoleRedirectPath(role: string): string {
  switch (role) {
    case 'PLAYER':
      return '/characters';
    case 'GM':
      return '/gm/campaigns';
    case 'ADMIN':
      return '/admin';
    default:
      return '/login';
  }
}

export function maskInviteCode(code: string): string {
  if (code.length <= 3) return code;
  return code.slice(0, 3) + '•'.repeat(code.length - 3);
}

export function formatTimeAgo(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diff = now - then;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `${weeks}w ago`;
  return formatDate(dateString);
}
