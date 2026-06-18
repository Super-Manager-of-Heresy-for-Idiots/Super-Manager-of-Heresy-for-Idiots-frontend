import { describe, it, expect } from 'vitest';
import { classNoSpellcasting, classWithSubclassChoice } from '@/fixtures/contentModel';
import { normalizeClassDetail, rewardGroupKey } from '@/lib/contentAdapters';
import {
  buildContentLevelUpRequest,
  contentLevelUpComplete,
  grantChildSatisfied,
  grantNeedsChild,
  groupComplete,
} from '@/pages/gm/campaigns/contentLevelUp';
import type { CharacterClassDetailResponse, RewardGroup } from '@/types';

const norm = (f: unknown) => normalizeClassDetail(f as CharacterClassDetailResponse);
const fighter = norm(classNoSpellcasting);
const cleric = norm(classWithSubclassChoice);

const groupById = (groups: RewardGroup[], id: string) => groups.find((g) => g.id === id)!;

describe('subclass choose-one group', () => {
  const groups = cleric.rewardGroups ?? [];
  const domain = groupById(groups, 'rg-cleric-1-domain');
  const key = rewardGroupKey(domain);

  it('is incomplete with no option and complete with one', () => {
    expect(groupComplete(domain, [], {})).toBe(false);
    expect(groupComplete(domain, ['opt-domain-life'], {})).toBe(true);
  });

  it('builds a reward selection with groupId + optionId', () => {
    const req = buildContentLevelUpRequest(cleric.id, groups, { [key]: ['opt-domain-life'] }, {});
    expect(req.classId).toBe(cleric.id);
    expect(req.selections).toContainEqual({
      rewardGroupId: 'rg-cleric-1-domain',
      optionIds: ['opt-domain-life'],
    });
  });
});

describe('ASI grant child choices', () => {
  const groups = fighter.rewardGroups ?? [];
  const asi = groupById(groups, 'rg-fighter-4-asi');
  const key = rewardGroupKey(asi);
  const plus2Grant = asi.options!.find((o) => o.id === 'opt-asi-plus2')!.grants![0];
  const splitGrant = asi.options!.find((o) => o.id === 'opt-asi-plus1plus1')!.grants![0];
  const featGrant = asi.options!.find((o) => o.id === 'opt-asi-feat')!.grants![0];

  it('flags ability grants as needing child input; feat does not', () => {
    expect(grantNeedsChild(plus2Grant)).toBe(true);
    expect(grantNeedsChild(splitGrant)).toBe(true);
    expect(grantNeedsChild(featGrant)).toBe(false);
  });

  it('+2 grant satisfied only when 2 points placed on one ability', () => {
    expect(grantChildSatisfied(plus2Grant, undefined)).toBe(false);
    expect(grantChildSatisfied(plus2Grant, { abilities: { 'stat-str': 2 } })).toBe(true);
    expect(grantChildSatisfied(plus2Grant, { abilities: { 'stat-str': 1 } })).toBe(false);
  });

  it('+1/+1 grant respects maxPerAbility=1', () => {
    expect(grantChildSatisfied(splitGrant, { abilities: { 'stat-str': 1, 'stat-dex': 1 } })).toBe(true);
    // 2 on one ability exceeds maxPerAbility even though total matches
    expect(grantChildSatisfied(splitGrant, { abilities: { 'stat-str': 2 } })).toBe(false);
  });

  it('feat option is complete with just the option selected', () => {
    expect(groupComplete(asi, ['opt-asi-feat'], {})).toBe(true);
  });

  it('ability option needs child to complete the group', () => {
    expect(groupComplete(asi, ['opt-asi-plus2'], {})).toBe(false);
    expect(groupComplete(asi, ['opt-asi-plus2'], { 'g-asi-2': { abilities: { 'stat-con': 2 } } })).toBe(true);
  });

  it('builds abilityScoreSelections for the chosen ability grant', () => {
    const req = buildContentLevelUpRequest(
      fighter.id,
      groups,
      { [key]: ['opt-asi-plus2'] },
      { 'g-asi-2': { abilities: { 'stat-con': 2 } } },
    );
    const sel = req.selections.find((r) => r.optionIds?.includes('opt-asi-plus2'));
    expect(sel?.childSelections?.abilityScores).toEqual([
      { abilityScoreId: 'stat-con', amount: 2 },
    ]);
  });
});

describe('contentLevelUpComplete (whole class)', () => {
  it('requires every content group to be resolved', () => {
    const groups = fighter.rewardGroups ?? [];
    // fighter level-1 fixture has an auto feature + a choose-one fighting style +
    // subclass + ASI. Empty selections must be incomplete.
    expect(contentLevelUpComplete(groups, {}, {})).toBe(false);
  });
});
