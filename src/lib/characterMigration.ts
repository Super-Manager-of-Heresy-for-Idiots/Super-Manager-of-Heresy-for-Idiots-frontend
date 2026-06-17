// Content-model runtime migration support (Phase 10). Pure helpers: detect a
// character's migration state from the optional backend signal and provide safe
// accessors so the sheet renders both legacy/transitional and migrated data.
import type { CharacterResponse, CharacterRewardsResponse, WalletEntry } from '@/types';

export type CharacterMigrationState = 'ok' | 'legacy' | 'upgrading' | 'blocked';

type MigrationSignal = Pick<
  CharacterResponse,
  'contentMigrationStatus' | 'contentMigrationBlocked' | 'contentMigrationMessage'
>;

/**
 * Migration state from the optional backend signal. Absent / MIGRATED => 'ok'
 * (no banner). `blocked` takes precedence — content-changing flows go read-only.
 */
export function characterMigrationState(c: MigrationSignal | undefined): CharacterMigrationState {
  if (!c) return 'ok';
  if (c.contentMigrationBlocked) return 'blocked';
  switch ((c.contentMigrationStatus ?? '').toUpperCase()) {
    case 'UPGRADING':
      return 'upgrading';
    case 'LEGACY':
      return 'legacy';
    default:
      return 'ok';
  }
}

export function isMigrationBlocked(c: MigrationSignal | undefined): boolean {
  return characterMigrationState(c) === 'blocked';
}

export function hasMigrationNotice(state: CharacterMigrationState): boolean {
  return state !== 'ok';
}

export function migrationMessage(c: MigrationSignal | undefined): string | undefined {
  return c?.contentMigrationMessage;
}

// ── Safe sheet accessors (handle both legacy and migrated shapes) ──
export function sheetClassLevels(c: CharacterResponse | undefined) {
  return c?.classLevels ?? [];
}
export function sheetStats(c: CharacterResponse | undefined) {
  return c?.stats ?? [];
}
export function sheetSkills(c: CharacterResponse | undefined) {
  return c?.skillProficiencies ?? [];
}
export function sheetSpells(c: CharacterResponse | undefined) {
  return c?.knownSpells ?? [];
}
export function sheetHp(c: CharacterResponse | undefined) {
  return { current: c?.currentHp ?? 0, max: c?.maxHp ?? 0, temp: c?.tempHp ?? 0 };
}
export function walletTotalGold(wallet: WalletEntry[] | undefined): number {
  return (wallet ?? []).reduce((sum, w) => sum + (w.goldEquivalent ?? 0), 0);
}
export function rewardsCount(rewards: CharacterRewardsResponse | undefined): number {
  return (rewards?.classBreakdown ?? []).reduce(
    (n, cb) => n + Object.values(cb.rewardsByType ?? {}).reduce((m, arr) => m + arr.length, 0),
    0,
  );
}
