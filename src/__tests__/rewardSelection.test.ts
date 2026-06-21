import { describe, it, expect } from 'vitest';
import {
  contentRewardGroupsOf,
  initialContentRewardGroupsOf,
  initialRewardSelectionsComplete,
  initialUnsatisfiedRewardCount,
  isOptionSelectable,
  rewardGroupStatuses,
} from '@/features/character-wizard/rewardSelection';
import type { RewardGroup } from '@/types';

const group = (o: Partial<RewardGroup>): RewardGroup => o as RewardGroup;

// A plain choose-N option group (options carry no child-requiring grants).
const optionGroup = (id: string, ids: string[], extra: Partial<RewardGroup> = {}): RewardGroup =>
  group({
    id,
    groupKey: id,
    options: ids.map((oid) => ({ id: oid, optionKey: oid, label: oid })) as RewardGroup['options'],
    ...extra,
  });

describe('contentRewardGroupsOf', () => {
  it('keeps only content-shaped groups (with grants or options)', () => {
    const withOptions = optionGroup('g1', ['a']);
    const withGrants = group({ id: 'g2', grants: [{ id: 'gr', grantType: 'FEATURE' }] });
    const empty = group({ id: 'g3', groupKind: 'NOTHING' });
    expect(contentRewardGroupsOf([withOptions, withGrants, empty])).toEqual([withOptions, withGrants]);
  });

  it('tolerates an undefined groups list', () => {
    expect(contentRewardGroupsOf(undefined)).toEqual([]);
  });
});

describe('initialContentRewardGroupsOf', () => {
  it('keeps only level-1 content groups (undefined level defaults to 1)', () => {
    const lvl1 = optionGroup('g1', ['a'], { classLevel: 1 });
    const lvlImplicit = optionGroup('g2', ['b']); // classLevel omitted -> treated as 1
    const lvl2 = optionGroup('g3', ['c'], { classLevel: 2 });
    expect(initialContentRewardGroupsOf([lvl1, lvlImplicit, lvl2])).toEqual([lvl1, lvlImplicit]);
  });
});

describe('rewardGroupStatuses', () => {
  it('reports selected count and satisfaction per group', () => {
    const g = optionGroup('g1', ['a', 'b'], { chooseMin: 1, chooseMax: 1 });
    const [status] = rewardGroupStatuses([g], { g1: ['a'] });
    expect(status.key).toBe('g1');
    expect(status.min).toBe(1);
    expect(status.max).toBe(1);
    expect(status.selectedCount).toBe(1);
    expect(status.satisfied).toBe(true);
  });

  it('treats a grant-only group as satisfied with no selection', () => {
    const g = group({ id: 'g2', groupKey: 'g2', grants: [{ id: 'gr', grantType: 'FEATURE' }] });
    const [status] = rewardGroupStatuses([g], {});
    expect(status.selectedCount).toBe(0);
    expect(status.satisfied).toBe(true);
  });
});

describe('initial reward completion helpers', () => {
  const groups = [
    optionGroup('g1', ['a', 'b'], { classLevel: 1, chooseMin: 1, chooseMax: 1 }),
    optionGroup('g2', ['c', 'd'], { classLevel: 1, chooseMin: 1, chooseMax: 1 }),
    optionGroup('g3', ['e'], { classLevel: 2, chooseMin: 1, chooseMax: 1 }),
  ];

  it('only requires level-1 groups to be resolved', () => {
    // g3 (level 2) is ignored even though it is unselected.
    expect(initialRewardSelectionsComplete(groups, { g1: ['a'], g2: ['c'] }, {})).toBe(true);
  });

  it('is incomplete while a level-1 group is unselected', () => {
    expect(initialRewardSelectionsComplete(groups, { g1: ['a'] }, {})).toBe(false);
  });

  it('counts only the unsatisfied level-1 groups', () => {
    expect(initialUnsatisfiedRewardCount(groups, {}, {})).toBe(2);
    expect(initialUnsatisfiedRewardCount(groups, { g1: ['a'] }, {})).toBe(1);
    expect(initialUnsatisfiedRewardCount(groups, { g1: ['a'], g2: ['c'] }, {})).toBe(0);
  });
});

describe('isOptionSelectable', () => {
  const single = optionGroup('s', ['a', 'b'], { chooseMin: 1, chooseMax: 1 });
  const multi = optionGroup('m', ['a', 'b', 'c'], { chooseMin: 1, chooseMax: 2 });

  it('always allows toggling an already-selected option (deselect path)', () => {
    expect(isOptionSelectable(multi, ['a', 'b'], 'a')).toBe(true);
  });

  it('treats single-choice groups as freely swappable', () => {
    expect(isOptionSelectable(single, ['a'], 'b')).toBe(true);
  });

  it('blocks new picks in a multi-choice group once chooseMax is reached', () => {
    expect(isOptionSelectable(multi, ['a'], 'c')).toBe(true); // 1 < 2 -> selectable
    expect(isOptionSelectable(multi, ['a', 'b'], 'c')).toBe(false); // 2 == max -> blocked
  });
});
