import type { WalletEntry } from '@/types';

export const walletTotalGold = (entries: WalletEntry[]): number =>
  entries.reduce((s, w) => s + (w.goldEquivalent ?? 0), 0);
