import { describe, it, expect } from 'vitest';
import {
  characterMigrationState,
  isMigrationBlocked,
  hasMigrationNotice,
  rewardsCount,
  sheetClassLevels,
  sheetHp,
  sheetSkills,
  sheetSpells,
  sheetStats,
  walletTotalGold,
} from '@/lib/characterMigration';
import type { CharacterResponse, CharacterRewardsResponse, WalletEntry } from '@/types';

const asChar = (o: object): CharacterResponse => o as unknown as CharacterResponse;

// A sparse legacy-shaped character (most optional fields absent).
const legacy = asChar({ id: 'c1', name: 'Old Hero', totalLevel: 3, classLevels: [], stats: [] });

// A fully migrated character with rich fields.
const migrated = asChar({
  id: 'c2',
  name: 'New Hero',
  totalLevel: 5,
  contentMigrationStatus: 'MIGRATED',
  classLevels: [{ classId: 'k', className: 'Fighter', classLevel: 5 }],
  stats: [{ id: 's', statTypeId: 'str', statTypeName: 'STR', value: 16 }],
  currentHp: 30,
  maxHp: 44,
  tempHp: 5,
  skillProficiencies: [{ skillId: 'a', skillName: 'Athletics' }],
  knownSpells: [{ spellId: 'sp', spellName: 'Bless' }],
});

describe('characterMigrationState', () => {
  it('treats absent / MIGRATED signal as ok (no banner)', () => {
    expect(characterMigrationState(undefined)).toBe('ok');
    expect(characterMigrationState(legacy)).toBe('ok');
    expect(characterMigrationState(migrated)).toBe('ok');
  });

  it('maps LEGACY / UPGRADING statuses', () => {
    expect(characterMigrationState(asChar({ contentMigrationStatus: 'LEGACY' }))).toBe('legacy');
    expect(characterMigrationState(asChar({ contentMigrationStatus: 'UPGRADING' }))).toBe('upgrading');
  });

  it('blocked takes precedence and drives read-only', () => {
    const c = asChar({ contentMigrationStatus: 'LEGACY', contentMigrationBlocked: true });
    expect(characterMigrationState(c)).toBe('blocked');
    expect(isMigrationBlocked(c)).toBe(true);
    expect(hasMigrationNotice(characterMigrationState(c))).toBe(true);
  });
});

describe('safe sheet accessors (both shapes)', () => {
  it('return empty defaults for a legacy/sparse character without throwing', () => {
    expect(sheetClassLevels(legacy)).toEqual([]);
    expect(sheetStats(legacy)).toEqual([]);
    expect(sheetSkills(legacy)).toEqual([]);
    expect(sheetSpells(legacy)).toEqual([]);
    expect(sheetHp(legacy)).toEqual({ current: 0, max: 0, temp: 0 });
  });

  it('read populated fields from a migrated character', () => {
    expect(sheetClassLevels(migrated)).toHaveLength(1);
    expect(sheetStats(migrated)).toHaveLength(1);
    expect(sheetSkills(migrated)).toHaveLength(1);
    expect(sheetSpells(migrated)).toHaveLength(1);
    expect(sheetHp(migrated)).toEqual({ current: 30, max: 44, temp: 5 });
  });

  it('handles undefined character', () => {
    expect(sheetStats(undefined)).toEqual([]);
    expect(sheetHp(undefined)).toEqual({ current: 0, max: 0, temp: 0 });
  });
});

describe('wallet & rewards smoke', () => {
  it('sums wallet gold equivalent, tolerating nulls/empty', () => {
    expect(walletTotalGold(undefined)).toBe(0);
    expect(walletTotalGold([])).toBe(0);
    const wallet = [
      { currencyTypeId: 'gp', currencyName: 'Gold', amount: 10, goldEquivalent: 10 },
      { currencyTypeId: 'sp', currencyName: 'Silver', amount: 50, goldEquivalent: 5 },
      { currencyTypeId: 'x', currencyName: 'Token', amount: 3, goldEquivalent: null },
    ] as WalletEntry[];
    expect(walletTotalGold(wallet)).toBe(15);
  });

  it('counts acquired rewards across class breakdowns', () => {
    expect(rewardsCount(undefined)).toBe(0);
    const rewards: CharacterRewardsResponse = {
      characterId: 'c2',
      totalLevel: 5,
      classBreakdown: [
        { classId: 'k', className: 'Fighter', classLevel: 5, rewardsByType: { FEAT: [{ name: 'Tough', acquiredAt: '' }], SKILL: [{ name: 'Athletics', acquiredAt: '' }] } },
      ],
    };
    expect(rewardsCount(rewards)).toBe(2);
  });
});
