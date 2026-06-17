import { describe, it, expect } from 'vitest';
import {
  classFullCaster,
  classHomebrewCustomGrant,
  classNoSpellcasting,
  classWithSubclassChoice,
} from '@/fixtures/contentModel';
import {
  isContentRewardGroup,
  normalizeClassDetail,
  rewardGroupChoose,
  rewardGroupKey,
} from '@/lib/contentAdapters';
import {
  rewardGroupStatuses,
  rewardSelectionsComplete,
  unsatisfiedRewardCount,
  isOptionSelectable,
} from '@/features/character-wizard/rewardSelection';
import { grantKind, isUnknownGrantKind } from '@/components/content-rewards/grants';
import { isKnownGrantType, KNOWN_GRANT_TYPES } from '@/types';
import type { CharacterClassDetailResponse } from '@/types';

// Fixtures are final-contract payloads (FinalClassDetail). The app normalizer
// fills legacy bridge fields; cast mirrors what the API client / viewer do.
const norm = (f: unknown) => normalizeClassDetail(f as CharacterClassDetailResponse);

describe('class detail rendering (mechanics from final contract)', () => {
  it('exposes multi-primary ability, separate proficiency text and skill options', () => {
    const d = norm(classNoSpellcasting);
    expect(d.primaryAbilities?.map((a) => a.name)).toEqual(['Сила', 'Ловкость']);
    expect(d.savingThrows?.length).toBe(2);
    expect(d.armorProficiencyText).toBeTruthy();
    expect(d.weaponProficiencyText).toBeTruthy();
    expect(d.toolProficiencyText).toBeTruthy();
    expect(d.skillChoiceCount).toBe(2);
    expect(d.skillChoiceAny).toBe(false);
    expect(d.skillOptions?.length).toBe(6);
    expect(d.spellcasting).toBeUndefined();
  });

  it('marks a full caster with spellcasting + cantrips', () => {
    const d = norm(classFullCaster);
    expect(d.spellcasting?.isSpellcaster).toBe(true);
    expect(d.spellcasting?.isHalfCaster).toBe(false);
    expect(d.spellcasting?.hasCantrips).toBe(true);
  });
});

describe('choose two skills', () => {
  it('reads skillChoiceCount=2 from the (non-any) class', () => {
    const d = norm(classNoSpellcasting);
    expect(d.skillChoiceAny).toBe(false);
    expect(d.skillChoiceCount).toBe(2);
    // enough distinct options to choose two
    expect((d.skillOptions?.length ?? 0)).toBeGreaterThanOrEqual(2);
  });
});

describe('choose one reward (subclass) — validation', () => {
  const detail = norm(classWithSubclassChoice);
  const groups = detail.rewardGroups ?? [];
  const subclassGroup = groups.find((g) => g.groupKind === 'SUBCLASS')!;
  const key = rewardGroupKey(subclassGroup);

  it('is a content-shaped choose-one group', () => {
    expect(isContentRewardGroup(subclassGroup)).toBe(true);
    const { min, max } = rewardGroupChoose(subclassGroup);
    expect(min).toBe(1);
    expect(max).toBe(1);
  });

  it('is unsatisfied with no selection and satisfied after picking one', () => {
    expect(rewardSelectionsComplete(groups, {})).toBe(false);
    expect(unsatisfiedRewardCount(groups, {})).toBe(1);

    const firstOption = subclassGroup.options![0].id;
    const selections = { [key]: [firstOption] };
    expect(rewardSelectionsComplete(groups, selections)).toBe(true);
    expect(unsatisfiedRewardCount(groups, selections)).toBe(0);

    const statuses = rewardGroupStatuses(groups, selections);
    expect(statuses.find((s) => s.key === key)?.satisfied).toBe(true);
  });

  it('treats a single-choice option as swappable (selectable)', () => {
    const a = subclassGroup.options![0].id;
    const b = subclassGroup.options![1].id;
    // selecting b while a is chosen is allowed (radio swap)
    expect(isOptionSelectable(subclassGroup, [a], b)).toBe(true);
  });
});

describe('custom / unknown grant display', () => {
  it('classifies known and unknown grant types without throwing', () => {
    expect(grantKind('SUBCLASS')).toBe('SUBCLASS');
    expect(grantKind('CUSTOM_TEXT')).toBe('CUSTOM');
    expect(grantKind('NUMERIC_MODIFIER')).toBe('MODIFIER');
    expect(grantKind('BLOOD_DICE')).toBe('UNKNOWN');
    expect(isUnknownGrantKind('BLOOD_DICE')).toBe(true);
    expect(isUnknownGrantKind('FEATURE')).toBe(false);
  });

  it('homebrew fixture carries an unknown grant type alongside a custom one', () => {
    const d = norm(classHomebrewCustomGrant);
    const grants = (d.rewardGroups ?? []).flatMap((g) => g.grants ?? []);
    const types = grants.map((g) => g.grantType);
    expect(types).toContain('CUSTOM_TEXT');
    expect(types.some((t) => isUnknownGrantKind(t))).toBe(true);
  });
});

describe('KNOWN_GRANT_TYPES contract', () => {
  it('recognises all eight typed payloads and rejects unknowns', () => {
    expect(KNOWN_GRANT_TYPES).toHaveLength(8);
    for (const gt of KNOWN_GRANT_TYPES) expect(isKnownGrantType(gt)).toBe(true);
    expect(isKnownGrantType('BLOOD_DICE')).toBe(false);
  });
});
