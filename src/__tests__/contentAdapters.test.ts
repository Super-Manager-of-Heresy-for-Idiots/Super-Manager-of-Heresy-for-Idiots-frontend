import { describe, it, expect } from 'vitest';
import {
  backgroundDetailToResponse,
  isContentGroupSatisfied,
  localizedName,
  normalizeAvailableClassOption,
  normalizeLevelUpOptions,
  normalizeRewardGrant,
  normalizeRewardGroup,
  rewardGroupChoose,
  rewardGroupKey,
  rewardGroupLabel,
  speciesDetailToRaceResponse,
  spellDetailToReference,
} from '@/lib/contentAdapters';
import type {
  BackgroundDetail,
  ContentLabel,
  ContentRewardGrant,
  RewardGroup,
  SpeciesDetail,
  SpellDetail,
} from '@/types';

// The fixtures elsewhere are full class payloads; for adapter unit tests we build
// the minimal shapes each function reads, casting like the existing test suites.
const group = (o: Partial<RewardGroup>): RewardGroup => o as RewardGroup;

describe('rewardGroupKey fallback chain', () => {
  it('prefers groupKey, then id, then groupKind, then a literal', () => {
    expect(rewardGroupKey(group({ groupKey: 'gk', id: 'i', groupKind: 'SUBCLASS' }))).toBe('gk');
    expect(rewardGroupKey(group({ id: 'i', groupKind: 'SUBCLASS' }))).toBe('i');
    expect(rewardGroupKey(group({ groupKind: 'SUBCLASS' }))).toBe('SUBCLASS');
    expect(rewardGroupKey(group({}))).toBe('group');
  });
});

describe('rewardGroupLabel', () => {
  it('uses a non-blank prompt', () => {
    expect(rewardGroupLabel(group({ prompt: 'Choose a domain', groupKind: 'SUBCLASS' }))).toBe(
      'Choose a domain',
    );
  });

  it('trims surrounding whitespace from the prompt', () => {
    expect(rewardGroupLabel(group({ prompt: '  Pick one  ' }))).toBe('Pick one');
  });

  it('falls back to groupKind, then a REWARD literal, when prompt is blank', () => {
    expect(rewardGroupLabel(group({ prompt: '   ', groupKind: 'FEAT' }))).toBe('FEAT');
    expect(rewardGroupLabel(group({}))).toBe('REWARD');
  });
});

describe('normalizeRewardGroup', () => {
  it('fills choose bounds to 1 for option groups and 0 for grant-only groups', () => {
    const withOptions = normalizeRewardGroup(
      group({ id: 'g1', options: [{ id: 'o1' }, { id: 'o2' }] as RewardGroup['options'] }),
    );
    expect(withOptions.chooseMin).toBe(1);
    expect(withOptions.chooseMax).toBe(1);

    const grantOnly = normalizeRewardGroup(group({ id: 'g2' }));
    expect(grantOnly.chooseMin).toBe(0);
    expect(grantOnly.chooseMax).toBe(0);
  });

  it('preserves explicit choose bounds', () => {
    const g = normalizeRewardGroup(
      group({ id: 'g3', chooseMin: 2, chooseMax: 3, options: [{ id: 'o' }] as RewardGroup['options'] }),
    );
    expect(g.chooseMin).toBe(2);
    expect(g.chooseMax).toBe(3);
  });

  it('defaults arrays/flags and fills a stable groupKey', () => {
    const g = normalizeRewardGroup(group({ id: 'gid' }));
    expect(g.grants).toEqual([]);
    expect(g.options).toEqual([]);
    expect(g.repeatable).toBe(false);
    expect(g.groupKey).toBe('gid');
  });
});

describe('normalizeRewardGrant (payload unwrap)', () => {
  const grant = (o: Partial<ContentRewardGrant>): ContentRewardGrant => o as ContentRewardGrant;

  it('returns fixtures (no payload) untouched', () => {
    const g = grant({ id: 'g', grantType: 'ABILITY_SCORE', abilityOptions: [{ id: 'str', name: 'STR' }] });
    expect(normalizeRewardGrant(g)).toBe(g);
  });

  it('surfaces ability payload fields onto the grant', () => {
    const g = grant({
      id: 'g',
      grantType: 'ABILITY_SCORE',
      payload: { abilityOptionIds: ['stat-str', 'stat-dex'], chooseCount: 2, bonusPerChoice: 1, totalBonus: 2, maxPerAbility: 2 },
    });
    const out = normalizeRewardGrant(g);
    expect(out.abilityOptionIds).toEqual(['stat-str', 'stat-dex']);
    expect(out.chooseCount).toBe(2);
    expect(out.totalBonus).toBe(2);
    expect(out.maxPerAbility).toBe(2);
  });

  it('surfaces skill payload incl. expertise and ANY flag', () => {
    const out = normalizeRewardGrant(grant({
      id: 'g',
      grantType: 'SKILL_PROFICIENCY',
      payload: { mode: 'ANY', chooseCount: 2, grantsExpertise: true },
    }));
    expect(out.mode).toBe('ANY');
    expect(out.anySkill).toBe(true);
    expect(out.grantsExpertise).toBe(true);
    expect(out.chooseCount).toBe(2);
  });

  it('surfaces spell payload pool filters', () => {
    const out = normalizeRewardGrant(grant({
      id: 'g',
      grantType: 'SPELL',
      payload: { mode: 'CHOICE', chooseCount: 1, minLevel: 0, maxLevel: 0, spellLevel: 0 },
    }));
    expect(out.mode).toBe('CHOICE');
    expect(out.chooseCount).toBe(1);
    expect(out.minLevel).toBe(0);
    expect(out.maxLevel).toBe(0);
  });

  it('does not set anySkill for a non-skill ANY-mode grant (e.g. feat)', () => {
    const out = normalizeRewardGrant(grant({ id: 'g', grantType: 'FEAT', payload: { mode: 'ANY' } }));
    expect(out.anySkill).toBeUndefined();
  });

  it('is applied when normalizing a whole group (direct + option grants)', () => {
    const g = normalizeRewardGroup(group({
      id: 'rg',
      grants: [grant({ id: 'd', grantType: 'ABILITY_SCORE', payload: { abilityOptionIds: ['a'], chooseCount: 1 } })],
      options: [
        { id: 'o', optionKey: 'o', label: 'o', grants: [grant({ id: 'og', grantType: 'SPELL', payload: { mode: 'CHOICE', chooseCount: 1 } })] },
      ] as RewardGroup['options'],
    }));
    expect(g.grants?.[0].abilityOptionIds).toEqual(['a']);
    expect(g.options?.[0].grants?.[0].mode).toBe('CHOICE');
  });
});

describe('normalizeAvailableClassOption / normalizeLevelUpOptions', () => {
  it('normalizes nested reward groups on each available class', () => {
    const option = normalizeAvailableClassOption({
      classId: 'c',
      className: 'Fighter',
      currentLevelInClass: 1,
      newLevelInClass: 2,
      rewardGroups: [group({ id: 'rg', options: [{ id: 'o' }] as RewardGroup['options'] })],
    });
    expect(option.rewardGroups[0].chooseMax).toBe(1);
    expect(option.rewardGroups[0].groupKey).toBe('rg');
  });

  it('tolerates a missing rewardGroups array', () => {
    const option = normalizeAvailableClassOption({
      classId: 'c',
      className: 'Fighter',
      currentLevelInClass: 1,
      newLevelInClass: 2,
    } as unknown as Parameters<typeof normalizeAvailableClassOption>[0]);
    expect(option.rewardGroups).toEqual([]);
  });

  it('maps every available class through the normalizer', () => {
    const normalized = normalizeLevelUpOptions({
      currentTotalLevel: 1,
      xpToNextLevel: 300,
      availableClasses: [
        {
          classId: 'c',
          className: 'Fighter',
          currentLevelInClass: 1,
          newLevelInClass: 2,
          rewardGroups: [group({ id: 'rg' })],
        },
      ],
    });
    expect(normalized.availableClasses[0].rewardGroups[0].groupKey).toBe('rg');
  });
});

describe('rewardGroupChoose', () => {
  it('treats grant-only groups as choose 0/0', () => {
    expect(rewardGroupChoose(group({}))).toEqual({ min: 0, max: 0 });
  });

  it('defaults option groups to choose exactly one', () => {
    expect(
      rewardGroupChoose(group({ options: [{ id: 'a' }, { id: 'b' }] as RewardGroup['options'] })),
    ).toEqual({ min: 1, max: 1 });
  });

  it('defaults min to max when only max is provided', () => {
    expect(
      rewardGroupChoose(
        group({ chooseMax: 3, options: [{ id: 'a' }] as RewardGroup['options'] }),
      ),
    ).toEqual({ min: 3, max: 3 });
  });
});

describe('isContentGroupSatisfied', () => {
  it('treats a grant-only (no options) group as automatically satisfied', () => {
    expect(isContentGroupSatisfied(group({}), [])).toBe(true);
  });

  it('requires at least chooseMin selections', () => {
    const g = group({ chooseMin: 1, chooseMax: 1, options: [{ id: 'a' }] as RewardGroup['options'] });
    expect(isContentGroupSatisfied(g, [])).toBe(false);
    expect(isContentGroupSatisfied(g, ['a'])).toBe(true);
  });

  it('rejects selecting more than chooseMax', () => {
    const g = group({
      chooseMin: 1,
      chooseMax: 2,
      options: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] as RewardGroup['options'],
    });
    expect(isContentGroupSatisfied(g, ['a', 'b'])).toBe(true);
    expect(isContentGroupSatisfied(g, ['a', 'b', 'c'])).toBe(false);
  });
});

describe('localizedName', () => {
  const label: Pick<ContentLabel, 'name' | 'nameRu' | 'nameEn'> = {
    name: 'Fighter',
    nameRu: 'Воин',
    nameEn: 'Fighter EN',
  };

  it('picks the Russian name in ru locale', () => {
    expect(localizedName(label, 'ru')).toBe('Воин');
  });

  it('picks the English name in en locale', () => {
    expect(localizedName(label, 'en')).toBe('Fighter EN');
  });

  it('falls back to base name when the localized value is blank', () => {
    expect(localizedName({ name: 'Fighter', nameRu: '   ' }, 'ru')).toBe('Fighter');
    expect(localizedName({ name: 'Fighter' }, 'en')).toBe('Fighter');
  });
});

describe('backgroundDetailToResponse', () => {
  it('flattens skill proficiencies to names and surfaces the granted feat', () => {
    const detail = {
      id: 'bg1',
      name: 'Soldier',
      description: 'A veteran.',
      grantedFeat: { id: 'f', name: 'Tough' },
      skillProficiencies: [
        { id: 's1', name: 'Athletics' },
        { id: 's2', name: 'Intimidation' },
      ],
    } as unknown as BackgroundDetail;

    expect(backgroundDetailToResponse(detail)).toEqual({
      id: 'bg1',
      name: 'Soldier',
      description: 'A veteran.',
      skillProficiencyNames: ['Athletics', 'Intimidation'],
      grantedExtras: 'Tough',
    });
  });

  it('tolerates missing optional collections / feat', () => {
    const detail = { id: 'bg2', name: 'Hermit' } as unknown as BackgroundDetail;
    const res = backgroundDetailToResponse(detail);
    expect(res.skillProficiencyNames).toEqual([]);
    expect(res.grantedExtras).toBeUndefined();
    expect(res.description).toBeUndefined();
  });
});

describe('speciesDetailToRaceResponse', () => {
  it('uses the walk speed and keeps named traits only', () => {
    const detail = {
      id: 'sp1',
      name: 'Elf',
      description: 'Graceful.',
      speeds: [
        { type: 'fly', amountFt: 60, rawText: null },
        { type: 'walk', amountFt: 30, rawText: null },
      ],
      traits: [
        { slug: 't1', name: 'Darkvision', description: null, effects: [] },
        { slug: 't2', name: null, description: null, effects: [] },
      ],
    } as unknown as SpeciesDetail;

    const res = speciesDetailToRaceResponse(detail);
    expect(res.speed).toBe(30);
    expect(res.traits).toEqual(['Darkvision']);
    // 2024 model: bonuses + subraces collapse to empty.
    expect(res.abilityScoreIncreases).toEqual([]);
    expect(res.subraces).toEqual([]);
  });

  it('falls back to the first speed entry when no walk speed exists', () => {
    const detail = {
      id: 'sp2',
      name: 'Construct',
      speeds: [{ type: 'hover', amountFt: 25, rawText: null }],
      traits: [],
    } as unknown as SpeciesDetail;
    expect(speciesDetailToRaceResponse(detail).speed).toBe(25);
  });
});

describe('spellDetailToReference', () => {
  it('flattens class availability to ids and normalizes nullable fields', () => {
    const detail = {
      id: 'sp',
      name: 'Fireball',
      nameEn: 'Fireball',
      level: 3,
      school: { id: 'evocation', name: 'Evocation' },
      description: 'Boom.',
      classes: [
        { id: 'wizard', name: 'Wizard' },
        { id: 'sorcerer', name: 'Sorcerer' },
      ],
    } as unknown as SpellDetail;

    expect(spellDetailToReference(detail)).toEqual({
      id: 'sp',
      name: 'Fireball',
      nameEn: 'Fireball',
      level: 3,
      school: 'Evocation',
      description: 'Boom.',
      availableToClassIds: ['wizard', 'sorcerer'],
    });
  });

  it('defaults a null level to 0 and a null school to undefined', () => {
    const detail = {
      id: 'sp2',
      name: 'Cantrip',
      nameEn: null,
      level: null,
      school: null,
      description: null,
      classes: [],
    } as unknown as SpellDetail;
    const res = spellDetailToReference(detail);
    expect(res.level).toBe(0);
    expect(res.school).toBeUndefined();
    expect(res.availableToClassIds).toEqual([]);
  });
});
