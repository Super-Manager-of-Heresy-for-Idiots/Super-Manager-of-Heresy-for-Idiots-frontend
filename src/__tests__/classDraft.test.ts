import { describe, it, expect } from 'vitest';
import {
  buildClassWriteRequest,
  emptyDraft,
  emptyGroup,
  emptyOption,
  hasBlockingErrors,
  issuesAt,
  validateClassDraft,
  type ClassDraft,
} from '@/features/class-builder/classDraft';
import type { GrantInput } from '@/types';

const grant = (grantType: string, payload: object): GrantInput =>
  ({ grantType, sortOrder: 0, payload } as GrantInput);

const validBase = (): ClassDraft => ({
  ...emptyDraft(),
  name: 'Stormbinder',
  hitDie: 8,
  primaryAbilityIds: ['ab_cha'],
});

describe('validateClassDraft — identity', () => {
  it('requires a name', () => {
    const issues = validateClassDraft(emptyDraft());
    expect(issues.some((i) => i.code === 'NAME_REQUIRED')).toBe(true);
    expect(hasBlockingErrors(issues)).toBe(true);
  });

  it('a minimal valid class has no blocking errors', () => {
    expect(hasBlockingErrors(validateClassDraft(validBase()))).toBe(false);
  });

  it('rejects a non-standard hit die', () => {
    const issues = validateClassDraft({ ...validBase(), hitDie: 7 });
    expect(issues.some((i) => i.code === 'HIT_DIE')).toBe(true);
  });
});

describe('validateClassDraft — reward groups', () => {
  it('CHOICE group needs at least one option', () => {
    const draft: ClassDraft = { ...validBase(), rewardGroups: [emptyGroup(3, 0, 'CHOICE')] };
    const issues = validateClassDraft(draft);
    expect(issues.some((i) => i.code === 'CHOICE_NO_OPTIONS')).toBe(true);
  });

  it('AUTO group cannot carry options', () => {
    const auto = { ...emptyGroup(1, 0, 'AUTO'), options: [emptyOption(0)] };
    const issues = validateClassDraft({ ...validBase(), rewardGroups: [auto] });
    expect(issues.some((i) => i.code === 'AUTO_WITH_OPTIONS')).toBe(true);
  });

  it('flags duplicate optionKey within a group', () => {
    const group = {
      ...emptyGroup(3, 0, 'CHOICE'),
      options: [
        { ...emptyOption(0), optionKey: 'dup', label: 'A', grants: [grant('SUBCLASS', { subclassId: 's1' })] },
        { ...emptyOption(1), optionKey: 'dup', label: 'B', grants: [grant('SUBCLASS', { subclassId: 's2' })] },
      ],
    };
    const issues = validateClassDraft({ ...validBase(), rewardGroups: [group] });
    expect(issues.some((i) => i.code === 'DUPLICATE_OPTION_KEY')).toBe(true);
  });

  it('a well-formed subclass CHOICE group is clean', () => {
    const group = {
      ...emptyGroup(3, 0, 'CHOICE'),
      options: [{ ...emptyOption(0), optionKey: 'champ', label: 'Champion', grants: [grant('SUBCLASS', { subclassId: 's1' })] }],
    };
    expect(hasBlockingErrors(validateClassDraft({ ...validBase(), rewardGroups: [group] }))).toBe(false);
  });
});

describe('validateClassDraft — grant payloads', () => {
  it('ABILITY_SCORE requires choose/bonus', () => {
    const group = {
      ...emptyGroup(4, 0, 'CHOICE'),
      options: [{ ...emptyOption(0), optionKey: 'asi', label: '+x', grants: [grant('ABILITY_SCORE', { chooseCount: 0, bonusPerChoice: 0 })] }],
    };
    const issues = validateClassDraft({ ...validBase(), rewardGroups: [group] });
    expect(issues.some((i) => i.code === 'ASI_COUNT')).toBe(true);
    expect(issues.some((i) => i.code === 'ASI_BONUS')).toBe(true);
  });

  it('FEATURE grant needs a reference or inline title', () => {
    const auto = { ...emptyGroup(1, 0, 'AUTO'), grants: [grant('FEATURE', { inline: { title: '' } })] };
    const issues = validateClassDraft({ ...validBase(), rewardGroups: [auto] });
    expect(issues.some((i) => i.code === 'FEATURE_REF_REQUIRED')).toBe(true);
  });
});

describe('buildClassWriteRequest', () => {
  it('assigns sortOrder, trims text and clears AUTO options', () => {
    const draft: ClassDraft = {
      ...validBase(),
      name: '  Stormbinder  ',
      rewardGroups: [
        { ...emptyGroup(1, 9, 'AUTO'), options: [emptyOption(0)], grants: [grant('FEATURE', { featureKey: 'f1' })] },
        {
          ...emptyGroup(3, 9, 'CHOICE'),
          options: [{ ...emptyOption(0), optionKey: 'a', label: '  A  ', grants: [grant('SUBCLASS', { subclassId: 's1' })] }],
        },
      ],
    };
    const req = buildClassWriteRequest(draft);
    expect(req.name).toBe('Stormbinder');
    expect(req.rewardGroups[0].sortOrder).toBe(0);
    expect(req.rewardGroups[1].sortOrder).toBe(1);
    expect(req.rewardGroups[0].options).toHaveLength(0); // AUTO options cleared
    expect(req.rewardGroups[1].options[0].label).toBe('A');
  });
});

describe('issuesAt', () => {
  it('filters issues by path prefix', () => {
    const draft: ClassDraft = { ...validBase(), rewardGroups: [emptyGroup(3, 0, 'CHOICE')] };
    const issues = validateClassDraft(draft);
    expect(issuesAt(issues, 'rewardGroups[0]').length).toBeGreaterThan(0);
    expect(issuesAt(issues, 'rewardGroups[1]').length).toBe(0);
  });
});
