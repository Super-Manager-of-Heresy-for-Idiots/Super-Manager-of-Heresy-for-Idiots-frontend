import type {
  AvailableClassOption,
  CharacterClassDetailResponse,
  ContentLabel,
  LevelUpOptionsResponse,
  ProficiencySkillResponse,
  RewardGroup,
} from '@/types';
import type { Lang } from '@/i18n/translations';

const fallbackText = (value: string | undefined, fallback: string): string => {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
};

export function rewardGroupKey(group: Pick<RewardGroup, 'id' | 'groupKey' | 'groupKind'>): string {
  return group.groupKey || group.id || group.groupKind || 'group';
}

export function rewardGroupLabel(group: Pick<RewardGroup, 'prompt' | 'groupKind'>): string {
  return fallbackText(group.prompt, group.groupKind || 'REWARD');
}

export function normalizeRewardGroup(group: RewardGroup): RewardGroup {
  const optionCount = group.options?.length ?? 0;
  const chooseMax = group.chooseMax ?? (optionCount > 0 ? 1 : 0);

  return {
    ...group,
    grants: group.grants ?? [],
    options: group.options ?? [],
    chooseMin: group.chooseMin ?? (optionCount > 0 ? 1 : 0),
    chooseMax,
    repeatable: group.repeatable ?? false,
    groupKey: rewardGroupKey(group),
  };
}

export function normalizeLevelUpOptions(options: LevelUpOptionsResponse): LevelUpOptionsResponse {
  return {
    ...options,
    availableClasses: options.availableClasses.map(normalizeAvailableClassOption),
  };
}

export function normalizeAvailableClassOption(option: AvailableClassOption): AvailableClassOption {
  return {
    ...option,
    rewardGroups: (option.rewardGroups ?? []).map(normalizeRewardGroup),
  };
}

export function normalizeClassDetail(detail: CharacterClassDetailResponse): CharacterClassDetailResponse {
  return {
    ...detail,
    primaryAbilities: detail.primaryAbilities ?? singleAbility(detail.primaryAbilityStatId),
    savingThrows: detail.savingThrows ?? namesToLabels(detail.savingThrowStatNames),
    skillOptions: detail.skillOptions ?? skillsToLabels(detail.skillChoiceOptions),
    skillChoiceAny: detail.skillChoiceAny ?? false,
    rewardGroups: detail.rewardGroups?.map(normalizeRewardGroup),
    spellcasting: detail.spellcasting
      ? {
          ...detail.spellcasting,
          isSpellcaster: detail.spellcasting.isSpellcaster ?? detail.spellcasting.spellcaster,
          isHalfCaster: detail.spellcasting.isHalfCaster ?? detail.spellcasting.halfCaster,
        }
      : undefined,
  };
}

function singleAbility(id: string | undefined): ContentLabel[] {
  return id ? [{ id, name: id }] : [];
}

function namesToLabels(names: string[] | undefined): ContentLabel[] {
  return (names ?? []).map((name) => ({ id: name, name }));
}

function skillsToLabels(skills: ProficiencySkillResponse[] | undefined): ContentLabel[] {
  return (skills ?? []).map((skill) => ({ id: skill.id, name: skill.name }));
}

/** Picks the locale-appropriate name for a content label, falling back to the base name. */
export function localizedName(
  label: Pick<ContentLabel, 'name' | 'nameRu' | 'nameEn'>,
  lang: Lang,
): string {
  const localized = lang === 'ru' ? label.nameRu : label.nameEn;
  return localized?.trim() ? localized : label.name;
}

/** A reward group is "content-shaped" when it carries the new grants/options payload. */
export function isContentRewardGroup(group: Pick<RewardGroup, 'grants' | 'options'>): boolean {
  return (group.grants?.length ?? 0) > 0 || (group.options?.length ?? 0) > 0;
}

/** Resolves the effective choose-min / choose-max for a group's options. */
export function rewardGroupChoose(
  group: Pick<RewardGroup, 'chooseMin' | 'chooseMax' | 'options'>,
): { min: number; max: number } {
  const optionCount = group.options?.length ?? 0;
  const max = group.chooseMax ?? (optionCount > 0 ? 1 : 0);
  const min = group.chooseMin ?? max;
  return { min, max };
}

/** Whether the current option selection satisfies a content group's choose rule. */
export function isContentGroupSatisfied(group: RewardGroup, selectedOptionIds: string[]): boolean {
  const optionCount = group.options?.length ?? 0;
  if (optionCount === 0) return true; // automatic group: direct grants only
  const { min, max } = rewardGroupChoose(group);
  const count = selectedOptionIds.length;
  if (count < min) return false;
  if (max > 0 && count > max) return false;
  return true;
}
