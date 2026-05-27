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
    case 'GAME_MASTER':
      return '/gm/teams';
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
