import { describe, it, expect } from 'vitest';
import {
  abilityTotalRequired,
  activeGrants,
  buildContentLevelUpRequest,
  grantChildSatisfied,
  grantNeedsChild,
} from '@/pages/gm/campaigns/contentLevelUp';
import type { ContentRewardGrant, RewardGroup } from '@/types';

const grant = (o: Partial<ContentRewardGrant>): ContentRewardGrant => o as ContentRewardGrant;
const group = (o: Partial<RewardGroup>): RewardGroup => o as RewardGroup;
const label = (id: string) => ({ id, name: id });

describe('abilityTotalRequired', () => {
  it('prefers an explicit totalBonus', () => {
    expect(abilityTotalRequired(grant({ grantType: 'ABILITY_SCORE', totalBonus: 2 }))).toBe(2);
  });

  it('derives the total from chooseCount * bonusPerChoice', () => {
    expect(
      abilityTotalRequired(grant({ grantType: 'ABILITY_SCORE', chooseCount: 2, bonusPerChoice: 1 })),
    ).toBe(2);
  });

  it('defaults missing counts to 1 each', () => {
    expect(abilityTotalRequired(grant({ grantType: 'ABILITY_SCORE' }))).toBe(1);
  });
});

describe('grantNeedsChild', () => {
  it('requires a child for ability grants only when options exist', () => {
    expect(grantNeedsChild(grant({ grantType: 'ABILITY_SCORE', abilityOptions: [label('str')] }))).toBe(
      true,
    );
    expect(grantNeedsChild(grant({ grantType: 'ABILITY_SCORE' }))).toBe(false);
  });

  it('requires a child for ability grants given by id-list (payload shape)', () => {
    expect(
      grantNeedsChild(grant({ grantType: 'ABILITY_SCORE', abilityOptionIds: ['stat-str', 'stat-dex'] })),
    ).toBe(true);
  });

  it('requires a child for choosable skill grants but not fixed ones', () => {
    expect(
      grantNeedsChild(grant({ grantType: 'SKILL', skillOptions: [label('a'), label('b')] })),
    ).toBe(true);
    // CHOICE / ANY given by id-list (payload shape)
    expect(
      grantNeedsChild(grant({ grantType: 'SKILL', mode: 'CHOICE', skillOptionIds: ['a', 'b'] })),
    ).toBe(true);
    expect(grantNeedsChild(grant({ grantType: 'SKILL', mode: 'ANY', anySkill: true }))).toBe(true);
    // FIXED grants (concrete skill or id-list) are auto-granted, no pick
    expect(
      grantNeedsChild(
        grant({ grantType: 'SKILL', fixedSkill: label('a'), skillOptions: [label('a')] }),
      ),
    ).toBe(false);
    expect(grantNeedsChild(grant({ grantType: 'SKILL', mode: 'FIXED', skillIds: ['a'] }))).toBe(false);
    expect(grantNeedsChild(grant({ grantType: 'SKILL' }))).toBe(false);
  });

  it('requires a child for CHOICE spell grants but not fixed ones or feats', () => {
    expect(grantNeedsChild(grant({ grantType: 'SPELL', mode: 'CHOICE', chooseCount: 1 }))).toBe(true);
    expect(grantNeedsChild(grant({ grantType: 'SPELL', chooseCount: 1 }))).toBe(true);
    // FIXED spell grants are learned automatically
    expect(grantNeedsChild(grant({ grantType: 'SPELL', mode: 'FIXED', fixedSpellIds: ['s1'] }))).toBe(false);
    expect(grantNeedsChild(grant({ grantType: 'SPELL', spell: label('fireball') }))).toBe(false);
    expect(grantNeedsChild(grant({ grantType: 'FEAT' }))).toBe(false);
  });
});

describe('grantChildSatisfied (skill branch)', () => {
  const skillGrant = grant({
    grantType: 'SKILL',
    skillOptions: [label('a'), label('b'), label('c')],
    chooseCount: 2,
  });

  it('requires exactly chooseCount skills', () => {
    expect(grantChildSatisfied(skillGrant, { skills: ['a', 'b'] })).toBe(true);
    expect(grantChildSatisfied(skillGrant, { skills: ['a'] })).toBe(false);
    expect(grantChildSatisfied(skillGrant, undefined)).toBe(false);
  });

  it('auto-satisfies grants that need no child', () => {
    expect(grantChildSatisfied(grant({ grantType: 'FEAT' }), undefined)).toBe(true);
  });
});

describe('grantChildSatisfied (spell branch)', () => {
  const spellGrant = grant({ grantType: 'SPELL', mode: 'CHOICE', chooseCount: 2 });

  it('requires exactly chooseCount spells', () => {
    expect(grantChildSatisfied(spellGrant, { spells: ['s1', 's2'] })).toBe(true);
    expect(grantChildSatisfied(spellGrant, { spells: ['s1'] })).toBe(false);
    expect(grantChildSatisfied(spellGrant, undefined)).toBe(false);
  });

  it('does not require a child for a fixed spell grant', () => {
    const fixed = grant({ grantType: 'SPELL', mode: 'FIXED', fixedSpellIds: ['s1'] });
    expect(grantChildSatisfied(fixed, undefined)).toBe(true);
  });
});

describe('activeGrants', () => {
  const direct = grant({ id: 'd1', grantType: 'FEATURE' });
  const optGrant = grant({ id: 'g1', grantType: 'FEAT' });
  const g = group({
    grants: [direct],
    options: [{ id: 'o1', optionKey: 'o1', label: 'o1', grants: [optGrant] }] as RewardGroup['options'],
  });

  it('returns only direct grants when no option is selected', () => {
    expect(activeGrants(g, []).map((x) => x.id)).toEqual(['d1']);
  });

  it('adds grants from selected options', () => {
    expect(activeGrants(g, ['o1']).map((x) => x.id)).toEqual(['d1', 'g1']);
  });
});

describe('buildContentLevelUpRequest', () => {
  it('drops ability points of zero and keeps positive ones', () => {
    const asiGrant = grant({ id: 'g-asi', grantType: 'ABILITY_SCORE', abilityOptions: [label('str')] });
    const groups = [
      group({
        id: 'rg-asi',
        groupKey: 'rg-asi',
        options: [
          { id: 'opt-asi', optionKey: 'opt-asi', label: 'opt-asi', grants: [asiGrant] },
        ] as RewardGroup['options'],
      }),
    ];
    const req = buildContentLevelUpRequest(
      'cls',
      groups,
      { 'rg-asi': ['opt-asi'] },
      { 'g-asi': { abilities: { str: 2, dex: 0 } } },
    );
    const sel = req.selections.find((s) => s.optionIds?.includes('opt-asi'));
    expect(sel?.childSelections?.abilityScores).toEqual([{ abilityScoreId: 'str', amount: 2 }]);
  });

  it('deduplicates skill ids gathered across grants', () => {
    const groups = [
      group({
        id: 'rg-skill',
        groupKey: 'rg-skill',
        options: [
          {
            id: 'opt-skill',
            optionKey: 'opt-skill',
            label: 'opt-skill',
            grants: [
              grant({ id: 'gs1', grantType: 'SKILL', skillOptions: [label('s1')], chooseCount: 1 }),
              grant({ id: 'gs2', grantType: 'SKILL', skillOptions: [label('s1'), label('s2')], chooseCount: 2 }),
            ],
          },
        ] as RewardGroup['options'],
      }),
    ];
    const req = buildContentLevelUpRequest(
      'cls',
      groups,
      { 'rg-skill': ['opt-skill'] },
      { gs1: { skills: ['s1'] }, gs2: { skills: ['s1', 's2'] } },
    );
    const sel = req.selections.find((s) => s.optionIds?.includes('opt-skill'));
    expect(sel?.childSelections?.skillIds).toEqual(['s1', 's2']);
  });

  it('omits childSelections when nothing was chosen', () => {
    const groups = [
      group({
        id: 'rg-sub',
        groupKey: 'rg-sub',
        options: [
          { id: 'opt-life', optionKey: 'opt-life', label: 'Life' },
        ] as RewardGroup['options'],
      }),
    ];
    const req = buildContentLevelUpRequest('cls', groups, { 'rg-sub': ['opt-life'] }, {});
    expect(req.selections).toEqual([{ rewardGroupId: 'rg-sub', optionIds: ['opt-life'] }]);
  });

  it('skips grant-only groups whose direct grants need no pick', () => {
    const groups = [
      group({ id: 'rg-auto', groupKey: 'rg-auto', grants: [grant({ id: 'gf', grantType: 'FEATURE' })] }),
    ];
    const req = buildContentLevelUpRequest('cls', groups, {}, {});
    expect(req.classId).toBe('cls');
    expect(req.selections).toEqual([]);
  });

  it('emits a selection for an AUTO group whose direct grant needs spell picks', () => {
    const groups = [
      group({
        id: 'rg-auto-spell',
        groupKey: 'rg-auto-spell',
        grants: [grant({ id: 'gsp', grantType: 'SPELL', mode: 'CHOICE', chooseCount: 1 })],
      }),
    ];
    const req = buildContentLevelUpRequest('cls', groups, {}, { gsp: { spells: ['sp-1'] } });
    expect(req.selections).toEqual([
      { rewardGroupId: 'rg-auto-spell', optionIds: [], childSelections: { spellIds: ['sp-1'] } },
    ]);
  });
});
